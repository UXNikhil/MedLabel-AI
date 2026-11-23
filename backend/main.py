import io
import os
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import pymupdf  # PyMuPDF

from models import (
    HealthResponse,
    DeviceCreate,
    DeviceUpdate,
    DeviceOut,
    LabelProjectCreate,
    LabelProjectUpdate,
    LabelProjectOut,
    StatsResponse,
    LabelUploadResponse,
    LabelGenerateRequest,
    LabelGenerateResponse,
    ExportPdfRequest,
    ComplianceCheckRequest,
    ComplianceCheckResponse,
    CompareLabelsRequest,
    CompareLabelsResponse,
    StatutoryRuleOut
)
from database import DatabaseManager
from gemini_service import GeminiService
from compliance_engine import ComplianceEngine
from label_pdf_exporter import LabelPdfExporter
from comparison_engine import ComparisonEngine

load_dotenv()

app = FastAPI(
    title="MedLabel AI Backend API",
    description="Medical Device Regulatory Label Management — Stage 2 AI, Ingestion & Compliance Engine (India, USA, EU)",
    version="2.0.0"
)

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# Health & Status
# ==============================================================================

@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def get_health():
    """System health check endpoint verifying Stage 2 operational status."""
    return HealthResponse(
        status="healthy",
        stage="Stage 2 — Core AI & Validation",
        version="2.0.0",
        timestamp=datetime.now(timezone.utc).isoformat(),
        environment=os.getenv("ENVIRONMENT", "local_development"),
        database=DatabaseManager.get_status(),
        features={
            "supabase_auth": True,
            "device_management": True,
            "project_management": True,
            "market_origin_selection": True,
            "stage_2_ai_gemini": GeminiService.is_configured(),
            "stage_2_pdf_ingestion": True,
            "stage_2_compliance_engine": True,
            "stage_2_label_compare": True,
            "stage_3_review_queue": False
        }
    )

@app.get("/api/gemini/status", tags=["Gemini AI"])
def get_gemini_status():
    """Returns Gemini AI configuration status and instructions if key is absent."""
    return GeminiService.get_status()

@app.get("/api/stats", response_model=StatsResponse, tags=["Dashboard"])
def get_stats():
    """Retrieve database metrics for devices, projects, and market distributions."""
    return DatabaseManager.get_stats()

# ==============================================================================
# Device CRUD Endpoints
# ==============================================================================

@app.get("/api/devices", response_model=List[DeviceOut], tags=["Devices"])
def list_devices(
    market: Optional[str] = Query(default=None, description="Filter by intended market (India, USA, EU)"),
    search: Optional[str] = Query(default=None, description="Search by name, model, or manufacturer")
):
    market_str = market if isinstance(market, str) else None
    search_str = search if isinstance(search, str) else None
    return DatabaseManager.list_devices(market=market_str, search=search_str)

@app.post("/api/devices", response_model=DeviceOut, status_code=status.HTTP_201_CREATED, tags=["Devices"])
def create_device(payload: DeviceCreate):
    created = DatabaseManager.create_device(payload.model_dump())
    return created

@app.get("/api/devices/{device_id}", response_model=DeviceOut, tags=["Devices"])
def get_device(device_id: str):
    device = DatabaseManager.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@app.put("/api/devices/{device_id}", response_model=DeviceOut, tags=["Devices"])
def update_device(device_id: str, payload: DeviceUpdate):
    updated = DatabaseManager.update_device(device_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Device not found")
    return updated

@app.delete("/api/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Devices"])
def delete_device(device_id: str):
    success = DatabaseManager.delete_device(device_id)
    if not success:
        raise HTTPException(status_code=404, detail="Device not found")
    return None

# ==============================================================================
# Label Project CRUD Endpoints
# ==============================================================================

@app.get("/api/projects", response_model=List[LabelProjectOut], tags=["Label Projects"])
def list_projects(
    market: Optional[str] = Query(default=None, description="Filter by destination market"),
    status: Optional[str] = Query(default=None, description="Filter by status (draft, in_review, approved)")
):
    market_str = market if isinstance(market, str) else None
    status_str = status if isinstance(status, str) else None
    return DatabaseManager.list_projects(market=market_str, status=status_str)

@app.post("/api/projects", response_model=LabelProjectOut, status_code=status.HTTP_201_CREATED, tags=["Label Projects"])
def create_project(payload: LabelProjectCreate):
    device = DatabaseManager.get_device(payload.device_id)
    if not device:
        raise HTTPException(status_code=400, detail="Linked medical device does not exist.")
    created = DatabaseManager.create_project(payload.model_dump())
    return created

@app.get("/api/projects/{project_id}", response_model=LabelProjectOut, tags=["Label Projects"])
def get_project(project_id: str):
    project = DatabaseManager.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Label project not found")
    return project

@app.put("/api/projects/{project_id}", response_model=LabelProjectOut, tags=["Label Projects"])
def update_project(project_id: str, payload: LabelProjectUpdate):
    updated = DatabaseManager.update_project(project_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Label project not found")
    return updated

@app.delete("/api/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Label Projects"])
def delete_project(project_id: str):
    success = DatabaseManager.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Label project not found")
    return None

# ==============================================================================
# Stage 2: Medical Label Upload & Text Extraction
# ==============================================================================

@app.post("/api/upload-label", response_model=LabelUploadResponse, tags=["Stage 2 — Ingestion"])
async def upload_label(file: UploadFile = File(...)):
    """Upload existing medical label PDF or image. Extracts text with PyMuPDF
    and proposes structured fields via Gemini AI (or deterministic extractor if key is not set).
    """
    contents = await file.read()
    filename = file.filename or "uploaded_label.pdf"
    raw_text = ""
    page_count = 1

    if filename.lower().endswith(".pdf") or file.content_type == "application/pdf":
        try:
            pdf_doc = pymupdf.open(stream=contents, filetype="pdf")
            page_count = len(pdf_doc)
            extracted_pages = []
            for i in range(page_count):
                page = pdf_doc.load_page(i)
                text = page.get_text("text")
                if text.strip():
                    extracted_pages.append(f"--- Page {i+1} ---\n{text}")
            raw_text = "\n\n".join(extracted_pages)
            if not raw_text.strip():
                raw_text = "[No digital text layer found in PDF. Scanned image OCR recommended.]"
        except Exception as e:
            raw_text = f"[PyMuPDF extraction note: {str(e)}]"
    else:
        # Image file
        raw_text = f"[Image uploaded: {filename} ({len(contents)} bytes). Text extraction placeholder.]"

    # AI / Deterministic field proposal
    proposed = await GeminiService.extract_fields_from_text(raw_text)

    return LabelUploadResponse(
        filename=filename,
        file_type=file.content_type or "unknown",
        raw_text=raw_text,
        page_count=page_count,
        proposed_fields=proposed,
        uncertain_fields=proposed.get("uncertain_fields", []),
        extraction_engine=proposed.get("extraction_engine", "unknown"),
        gemini_status=GeminiService.get_status(),
        notes=proposed.get("notes", "Review proposed fields before generating draft label.")
    )

# ==============================================================================
# Stage 2: AI Label Generator & PDF Export
# ==============================================================================

@app.post("/api/generate-label", response_model=LabelGenerateResponse, tags=["Stage 2 — Label Generator"])
def generate_label(payload: LabelGenerateRequest):
    """Generate editable medical-device label draft from device master or custom overrides.
    Never invents missing regulatory information.
    """
    label_dict = {}

    if payload.device_id:
        dev = DatabaseManager.get_device(payload.device_id)
        if dev:
            label_dict = {
                "name": dev.get("name"),
                "model_number": dev.get("model_number"),
                "manufacturer": dev.get("manufacturer"),
                "country_of_origin": dev.get("country_of_origin"),
                "intended_market": payload.destination_market or dev.get("intended_market"),
                "importer_name": dev.get("importer_name"),
                "importer_address": dev.get("importer_address"),
                "lot_number": dev.get("lot_number"),
                "serial_number": dev.get("serial_number"),
                "manufacturing_date": dev.get("manufacturing_date"),
                "expiry_date": dev.get("expiry_date"),
                "storage_conditions": dev.get("storage_conditions"),
                "warnings_cautions": dev.get("warnings_cautions"),
                "udi_di": dev.get("udi_di"),
                "packaging_level": payload.packaging_level or dev.get("packaging_level"),
                "language": dev.get("language", "en")
            }

    # Apply overrides
    if payload.field_overrides:
        for k, v in payload.field_overrides.items():
            if v is not None:
                label_dict[k] = v

    now_str = datetime.now(timezone.utc).isoformat()

    # Save version snapshot
    DatabaseManager.save_label_version({
        "project_id": payload.project_id,
        "label_data": label_dict,
        "version_tag": "v1.0-draft",
        "source_type": "ai_generated"
    })

    return LabelGenerateResponse(
        label_data=label_dict,
        destination_market=payload.destination_market,
        packaging_level=payload.packaging_level,
        watermark_notice="MEDLABEL AI PROTOTYPE ONLY - NOT CERTIFIED BY US FDA / INDIA CDSCO / EU MDR",
        generated_at=now_str
    )

@app.post("/api/export-label-pdf", tags=["Stage 2 — Label Generator"])
def export_label_pdf(payload: ExportPdfRequest):
    """Generates a downloadable watermarked medical device label PDF."""
    try:
        pdf_bytes = LabelPdfExporter.generate_pdf_bytes(payload.label_data, market=payload.destination_market)
        filename = f"MedLabel_{payload.destination_market}_{payload.label_data.get('model_number', 'draft')}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate label PDF: {str(e)}")

# ==============================================================================
# Stage 2: Multinational Compliance Checker
# ==============================================================================

@app.get("/api/compliance/rules", response_model=List[StatutoryRuleOut], tags=["Stage 2 — Compliance Engine"])
def get_rules(jurisdiction: Optional[str] = Query(default=None, description="Filter rules by jurisdiction (India, USA, EU)")):
    """Returns official curated statutory rules with reference sections and URLs."""
    return ComplianceEngine.get_rules_catalog(jurisdiction=jurisdiction)

@app.post("/api/compliance/check", response_model=ComplianceCheckResponse, tags=["Stage 2 — Compliance Engine"])
async def run_compliance_check(payload: ComplianceCheckRequest):
    """Runs deterministic rule checks for target destination market, attaches AI advisory,
    and persists report in database.
    """
    device_data = {}
    if payload.device_id:
        dev = DatabaseManager.get_device(payload.device_id)
        if dev:
            device_data = dev

    label_data = payload.label_data or device_data
    if not label_data:
        raise HTTPException(status_code=400, detail="Either device_id or label_data must be provided.")

    check_res = await ComplianceEngine.evaluate_label(
        device=device_data or label_data,
        label_data=label_data,
        destination_market=payload.destination_market
    )

    # Persist report
    report_record = DatabaseManager.save_compliance_report({
        "project_id": payload.project_id,
        "summary": check_res["summary"],
        "results": check_res["results"]
    })

    return ComplianceCheckResponse(
        summary=check_res["summary"],
        results=check_res["results"]
    )

@app.get("/api/compliance/reports", tags=["Stage 2 — Compliance Engine"])
def list_compliance_reports(project_id: Optional[str] = Query(default=None)):
    """Retrieve saved compliance validation reports."""
    return DatabaseManager.list_compliance_reports(project_id=project_id)

# ==============================================================================
# Stage 2: Label Comparison
# ==============================================================================

@app.post("/api/compare-labels", response_model=CompareLabelsResponse, tags=["Stage 2 — Compare"])
def compare_labels(payload: CompareLabelsRequest):
    """Compares base vs revised label, highlights field and text differences,
    and detects altered regulatory parameters.
    """
    comp_res = ComparisonEngine.compare_labels(
        base_label=payload.base_label,
        revised_label=payload.revised_label,
        base_name=payload.base_name,
        revised_name=payload.revised_name
    )

    # Persist comparison
    DatabaseManager.save_label_comparison({
        "project_id": payload.project_id,
        "base_name": payload.base_name,
        "revised_name": payload.revised_name,
        "summary": comp_res["summary"],
        "field_changes": comp_res["field_changes"],
        "text_diff": comp_res["text_diff"]
    })

    return CompareLabelsResponse(
        base_name=comp_res["base_name"],
        revised_name=comp_res["revised_name"],
        summary=comp_res["summary"],
        field_changes=comp_res["field_changes"],
        text_diff=comp_res["text_diff"]
    )

@app.get("/api/comparisons", tags=["Stage 2 — Compare"])
def list_comparisons(project_id: Optional[str] = Query(default=None)):
    """Retrieve stored label comparison results."""
    return DatabaseManager.list_label_comparisons(project_id=project_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
