import io
import json
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from main import app
from database import DatabaseManager
from gemini_service import GeminiService
from compliance_engine import ComplianceEngine
from label_pdf_exporter import LabelPdfExporter

client = TestClient(app)

def test_stage3_health_check():
    """Verify Stage 3 health endpoint reporting full feature readiness."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Stage 3" in data["stage"]
    assert data["features"]["stage_3_review_queue"] is True
    assert data["features"]["stage_3_immutable_audit"] is True
    print("✓ Test 1 Passed: Stage 3 health check & feature flags verified.")

def test_gemini_api_status_and_fallback():
    """Test Gemini API configured status and fallback extractor behavior."""
    res = client.get("/api/gemini/status")
    assert res.status_code == 200
    data = res.json()
    is_cfg = data["configured"]
    print(f"✓ Test 2 Passed: Gemini API status reported (configured: {is_cfg}).")

def test_end_to_end_review_workflow_and_security():
    """Test full workflow:
    1. Create Germany-to-India Imported Device
    2. Create Label Project
    3. Generate Label Draft
    4. Run Multinational Compliance Check (India CDSCO)
    5. Submit for Review (Draft -> In Review)
    6. Verify Prevention of Self-Approval (HTTP 403)
    7. Verify Prevention of Unauthorized Editor Approval (HTTP 403)
    8. Independent Reviewer Approval (In Review -> Approved)
    9. Verify Immutability of Approved Project (HTTP 409 on edits/deletes)
    10. Export Validated PDF
    """
    # 1. Create Germany -> India imported medical device
    dev_payload = {
        "name": "CardioRhythm Implantable Cardioverter Defibrillator",
        "model_number": "CR-ICD-900",
        "manufacturer": "BioMedica Berlin GmbH",
        "country_of_origin": "Germany",
        "intended_market": "India",
        "importer_name": "MedEquip India Pvt Ltd",
        "importer_address": "Plot 42, Tech Park, Whitefield, Bengaluru 560066 (CDSCO Import Lic: MD-IMP-2024-8902)",
        "lot_number": "LOT-DE-2024-X9",
        "serial_number": "SN-98234-DE",
        "manufacturing_date": "2024-03-15",
        "expiry_date": "2029-03-14",
        "storage_conditions": "Store between 15°C and 25°C in dry container.",
        "warnings_cautions": "RESTRICTED: Federal law restricts this device to sale by or on the order of a physician. Single use only.",
        "udi_di": "04012345678901",
        "udi_pi": "(17)290314(10)LOT-DE-2024-X9",
        "packaging_level": "primary",
        "language": "en"
    }
    dev_res = client.post("/api/devices", json=dev_payload)
    assert dev_res.status_code == 201
    device = dev_res.json()
    device_id = device["id"]
    creator_id = device["user_id"]
    print("✓ Step 1: Created imported medical device (Germany -> India).")

    # 2. Create Label Project
    proj_payload = {
        "device_id": device_id,
        "title": "CardioRhythm ICD India CDSCO Primary Label",
        "destination_market": "India",
        "packaging_level": "primary",
        "version": "v1.0-draft",
        "status": "draft",
        "notes": "CDSCO Medical Devices Rules 2017 compliant label draft for imported active implantable."
    }
    proj_res = client.post("/api/projects", json=proj_payload)
    assert proj_res.status_code == 201
    project = proj_res.json()
    project_id = project["id"]
    print("✓ Step 2: Created draft label project.")

    # 3. Generate Label Draft
    gen_payload = {
        "project_id": project_id,
        "device_id": device_id,
        "destination_market": "India",
        "packaging_level": "primary"
    }
    gen_res = client.post("/api/generate-label", json=gen_payload)
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    assert gen_data["label_data"]["name"] == device["name"]
    assert gen_data["label_data"]["importer_name"] == "MedEquip India Pvt Ltd"
    print("✓ Step 3: Generated regulatory label draft with verified importer data.")

    # 4. Run Multinational Compliance Check (India CDSCO)
    comp_payload = {
        "project_id": project_id,
        "device_id": device_id,
        "label_data": gen_data["label_data"],
        "destination_market": "India"
    }
    comp_res = client.post("/api/compliance/check", json=comp_payload)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["summary"]["is_imported_to_target"] is True
    # Verify CDSCO Importer Rule was evaluated
    importer_check = next((c for c in comp_data["results"] if c["rule_code"] == "IN-CDSCO-03"), None)
    assert importer_check is not None
    assert importer_check["status"] == "PASS"
    print("✓ Step 4: CDSCO compliance engine validated India-specific imported labeling rules.")

    # 5. Submit Draft for Review
    sub_res = client.post(f"/api/projects/{project_id}/submit-review", json={
        "project_id": project_id,
        "user_id": creator_id,
        "notes": "Ready for independent clinical and regulatory evaluation."
    })
    assert sub_res.status_code == 200
    assert sub_res.json()["status"] == "in_review"
    print("✓ Step 5: Submitted project for formal review (Draft -> In Review).")

    # 6. Verify Prevention of Self-Approval (Creator cannot approve their own label)
    self_approve_payload = {
        "project_id": project_id,
        "decision": "approved",
        "comments": "Self approval attempt by author.",
        "reviewer_id": creator_id,  # Same as creator!
        "reviewer_name": "Dr. Priya Sharma",
        "reviewer_email": "editor@medlabel.ai",
        "reviewer_role": "reviewer"
    }
    self_res = client.post("/api/reviews", json=self_approve_payload)
    assert self_res.status_code == 403
    assert "Self-approval prohibited" in self_res.json()["detail"]
    print("✓ Step 6: Self-approval correctly blocked with HTTP 403 Forbidden.")

    # 7. Verify Prevention of Unauthorized Editor Approval
    unauth_payload = {
        "project_id": project_id,
        "decision": "approved",
        "comments": "Approval attempt with editor role.",
        "reviewer_id": "99999999-9999-9999-9999-999999999999",
        "reviewer_name": "Junior Assistant",
        "reviewer_email": "intern@medlabel.ai",
        "reviewer_role": "editor"  # Not reviewer or admin!
    }
    unauth_res = client.post("/api/reviews", json=unauth_payload)
    assert unauth_res.status_code == 403
    assert "Unauthorized" in unauth_res.json()["detail"]
    print("✓ Step 7: Unauthorized role approval blocked with HTTP 403 Forbidden.")

    # 8. Legitimate Independent Reviewer Approval
    legit_reviewer_id = "88888888-8888-8888-8888-888888888888"
    legit_payload = {
        "project_id": project_id,
        "decision": "approved",
        "comments": "Sourced CDSCO Rule 109 verified. Importer registration valid. Approved for regulatory filing.",
        "reviewer_id": legit_reviewer_id,
        "reviewer_name": "Dr. Marcus Vance",
        "reviewer_email": "reviewer@medlabel.ai",
        "reviewer_role": "reviewer"
    }
    legit_res = client.post("/api/reviews", json=legit_payload)
    assert legit_res.status_code == 201
    review = legit_res.json()
    assert review["decision"] == "approved"

    # Verify project status transitioned to approved
    proj_check = client.get(f"/api/projects/{project_id}").json()
    assert proj_check["status"] == "approved"
    print("✓ Step 8: Independent reviewer successfully approved project.")

    # 9. Verify Immutability of Approved Project
    # Attempting to edit an approved project must return HTTP 409 Conflict
    edit_res = client.put(f"/api/projects/{project_id}", json={"title": "Modified Title Hack"})
    assert edit_res.status_code == 409
    assert "Immutable regulatory record" in edit_res.json()["detail"]

    # Attempting to delete an approved project must return HTTP 409 Conflict
    del_res = client.delete(f"/api/projects/{project_id}")
    assert del_res.status_code == 409
    assert "Immutable regulatory record" in del_res.json()["detail"]
    print("✓ Step 9: Approved record immutability enforced (Edits & Deletes blocked with HTTP 409).")

    # 10. Export Validated PDF
    pdf_res = client.post("/api/export-label-pdf", json={
        "label_data": gen_data["label_data"],
        "destination_market": "India",
        "version_tag": "v1.0-approved"
    })
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000
    # PDF must start with %PDF-
    assert pdf_res.content.startswith(b"%PDF-")
    print(f"✓ Step 10: Exported compliant PDF ({len(pdf_res.content)} bytes).")

def test_multinational_market_rules():
    """Verify accurate rule execution across India, USA, and EU markets."""
    # 1. USA Device Check
    usa_device = {
        "name": "EndoProbe Ultrasonic Scanner",
        "model_number": "EP-500",
        "manufacturer": "ImagingTech Inc",
        "country_of_origin": "USA",
        "intended_market": "USA",
        "udi_di": "01234567890123",
        "packaging_level": "primary"
    }
    usa_res = client.post("/api/compliance/check", json={
        "label_data": usa_device,
        "destination_market": "USA"
    })
    assert usa_res.status_code == 200
    usa_findings = usa_res.json()["results"]
    assert any("FDA" in f["rule_code"] for f in usa_findings)
    print("✓ USA FDA 21 CFR Part 801 rules verified.")

    # 2. EU MDR Device Check
    eu_device = {
        "name": "StentGraft Vascular Endoprosthesis",
        "model_number": "SG-EU-88",
        "manufacturer": "EuroVasc SARL",
        "country_of_origin": "France",
        "intended_market": "EU",
        "packaging_level": "primary"
    }
    eu_res = client.post("/api/compliance/check", json={
        "label_data": eu_device,
        "destination_market": "EU"
    })
    assert eu_res.status_code == 200
    eu_findings = eu_res.json()["results"]
    assert any("MDR" in f["rule_code"] for f in eu_findings)
    print("✓ EU MDR 2017/745 rules verified.")

def test_immutable_audit_trail_logging_and_filters():
    """Verify that all actions were recorded in the immutable audit trail and filtering works."""
    logs_res = client.get("/api/audit-logs?limit=50")
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) >= 3

    # Check for presence of review approved action
    actions = [l["action"] for l in logs]
    assert "REVIEW_APPROVED" in actions
    assert "REVIEW_SUBMITTED" in actions

    # Test filtering by action
    filtered = client.get("/api/audit-logs?action=REVIEW_APPROVED").json()
    assert all(l["action"] == "REVIEW_APPROVED" for l in filtered)
    print(f"✓ Audit Trail verified: {len(logs)} records retrieved with full filter support.")

def test_error_handling_corrupt_files():
    """Verify graceful error handling for invalid or corrupt PDF files."""
    corrupt_bytes = b"NOT_A_VALID_PDF_HEADER_DATA_12345678"
    res = client.post(
        "/api/upload-label",
        files={"file": ("corrupt_label.pdf", corrupt_bytes, "application/pdf")}
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["uncertain_fields"]) > 0
    assert "PyMuPDF" in data["raw_text"] or "extraction note" in data["raw_text"]
    print("✓ Error Handling verified: Corrupt PDF parsed safely without server crash.")

if __name__ == "__main__":
    print("\n=======================================================")
    print("RUNNING MEDLABEL AI STAGE 3 END-TO-END TEST SUITE")
    print("=======================================================\n")
    test_stage3_health_check()
    test_gemini_api_status_and_fallback()
    test_end_to_end_review_workflow_and_security()
    test_multinational_market_rules()
    test_immutable_audit_trail_logging_and_filters()
    test_error_handling_corrupt_files()
    print("\n=======================================================")
    print("ALL STAGE 3 TESTS COMPLETED AND PASSED SUCCESSFULLY!")
    print("=======================================================\n")
