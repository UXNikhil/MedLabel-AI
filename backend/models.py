from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str
    stage: str
    version: str
    timestamp: str
    environment: str
    database: str
    features: Dict[str, Any]

class DeviceBase(BaseModel):
    name: str = Field(..., description="Device commercial/brand name")
    model_number: str = Field(..., description="Model number or catalog code")
    manufacturer: str = Field(..., description="Legal manufacturer name and address")
    country_of_origin: str = Field(..., description="Manufacturing country of origin (e.g. Germany, USA, India)")
    intended_market: str = Field(..., description="Destination market: India, USA, EU, or Global")
    importer_name: Optional[str] = Field(None, description="Conditional importer name if imported")
    importer_address: Optional[str] = Field(None, description="Conditional importer address & licence if imported")
    lot_number: Optional[str] = None
    serial_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    storage_conditions: Optional[str] = None
    warnings_cautions: Optional[str] = None
    udi_di: Optional[str] = Field(None, description="Unique Device Identifier - Device Identifier")
    udi_pi: Optional[str] = Field(None, description="Unique Device Identifier - Production Identifier")
    packaging_level: str = Field("primary", description="primary, secondary, or shipper")
    language: str = Field("en", description="Primary label language code")

class DeviceCreate(DeviceBase):
    pass

class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    model_number: Optional[str] = None
    manufacturer: Optional[str] = None
    country_of_origin: Optional[str] = None
    intended_market: Optional[str] = None
    importer_name: Optional[str] = None
    importer_address: Optional[str] = None
    lot_number: Optional[str] = None
    serial_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    storage_conditions: Optional[str] = None
    warnings_cautions: Optional[str] = None
    udi_di: Optional[str] = None
    udi_pi: Optional[str] = None
    packaging_level: Optional[str] = None
    language: Optional[str] = None

class DeviceOut(DeviceBase):
    id: str
    user_id: str
    created_at: str
    updated_at: str

class LabelProjectBase(BaseModel):
    device_id: str
    title: str
    destination_market: str = Field(..., description="India, USA, or EU")
    packaging_level: str = Field("primary", description="primary, secondary, or shipper")
    version: str = Field("v1.0-draft")
    status: str = Field("draft", description="draft, in_review, approved, or rejected")
    notes: Optional[str] = None

class LabelProjectCreate(LabelProjectBase):
    pass

class LabelProjectUpdate(BaseModel):
    title: Optional[str] = None
    destination_market: Optional[str] = None
    packaging_level: Optional[str] = None
    version: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class LabelProjectOut(LabelProjectBase):
    id: str
    user_id: str
    created_at: str
    updated_at: str
    device_name: Optional[str] = None
    device_model: Optional[str] = None

class StatsResponse(BaseModel):
    total_devices: int
    total_projects: int
    imported_devices_count: int
    market_distribution: Dict[str, int]
    status_distribution: Dict[str, int]
    packaging_distribution: Dict[str, int]

# ==============================================================================
# Stage 2 Models
# ==============================================================================

class LabelUploadResponse(BaseModel):
    filename: str
    file_type: str
    raw_text: str
    page_count: int
    proposed_fields: Dict[str, Any]
    uncertain_fields: List[str]
    extraction_engine: str
    gemini_status: Dict[str, Any]
    notes: str

class LabelGenerateRequest(BaseModel):
    device_id: Optional[str] = None
    project_id: Optional[str] = None
    destination_market: str = "India"
    packaging_level: str = "primary"
    field_overrides: Optional[Dict[str, Any]] = None

class LabelGenerateResponse(BaseModel):
    label_data: Dict[str, Any]
    destination_market: str
    packaging_level: str
    watermark_notice: str
    generated_at: str

class ExportPdfRequest(BaseModel):
    label_data: Dict[str, Any]
    destination_market: str = "India"

class ComplianceCheckRequest(BaseModel):
    device_id: Optional[str] = None
    project_id: Optional[str] = None
    destination_market: str
    label_data: Optional[Dict[str, Any]] = None

class ComplianceCheckResponse(BaseModel):
    summary: Dict[str, Any]
    results: List[Dict[str, Any]]

class CompareLabelsRequest(BaseModel):
    project_id: Optional[str] = None
    base_label: Dict[str, Any]
    revised_label: Dict[str, Any]
    base_name: str = "Original / Baseline Label"
    revised_name: str = "Revised / Draft Label"

class CompareLabelsResponse(BaseModel):
    base_name: str
    revised_name: str
    summary: Dict[str, Any]
    field_changes: List[Dict[str, Any]]
    text_diff: str

class StatutoryRuleOut(BaseModel):
    rule_code: str
    jurisdiction: str
    title: str
    description: str
    source_reference: str
    source_url: str
    applicability: str
    severity: str
