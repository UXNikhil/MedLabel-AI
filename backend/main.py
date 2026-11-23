from datetime import datetime, timezone
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models import (
    HealthResponse,
    DeviceCreate,
    DeviceUpdate,
    DeviceOut,
    LabelProjectCreate,
    LabelProjectUpdate,
    LabelProjectOut,
    StatsResponse
)
from database import DatabaseManager

load_dotenv()

app = FastAPI(
    title="MedLabel AI Backend API",
    description="Medical Device Label Management Backend — Stage 1 Foundation (India CDSCO, USA FDA, EU MDR)",
    version="1.0.0"
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

@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def get_health():
    """System health check endpoint verifying Stage 1 operational status and database connectivity."""
    return HealthResponse(
        status="healthy",
        stage="Stage 1 — Functional Foundation",
        version="1.0.0",
        timestamp=datetime.now(timezone.utc).isoformat(),
        environment=os.getenv("ENVIRONMENT", "local_development"),
        database=DatabaseManager.get_status(),
        features={
            "supabase_auth": True,
            "device_management": True,
            "project_management": True,
            "market_origin_selection": True,
            "stage_2_ai_gemini": False,
            "stage_2_compliance_engine": False,
            "stage_3_review_queue": False
        }
    )

@app.get("/api/stats", response_model=StatsResponse, tags=["Dashboard"])
def get_stats():
    """Retrieve real database metrics for devices, projects, and market distributions."""
    return DatabaseManager.get_stats()

# ------------------------------------------------------------------------------
# Device CRUD Endpoints
# ------------------------------------------------------------------------------

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

# ------------------------------------------------------------------------------
# Label Project CRUD Endpoints
# ------------------------------------------------------------------------------

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
