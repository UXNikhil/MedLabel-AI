import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
USE_DEMO_STORE = os.getenv("USE_DEMO_STORE", "false").lower() in ("true", "1", "yes")

is_live_configured = bool(SUPABASE_URL and SUPABASE_KEY and "your-project" not in SUPABASE_URL)

supabase_client = None
if is_live_configured and not USE_DEMO_STORE:
    try:
        from supabase import create_client, Client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[Database] Connected to live Supabase database.")
    except Exception as e:
        print(f"[Database] FATAL: Supabase connection failed: {e}")
        raise RuntimeError(f"Live Supabase connection failed: {e}") from e
elif USE_DEMO_STORE:
    print("[Database] Explicit DEMO mode enabled (USE_DEMO_STORE=true). Using local in-memory mock store.")
else:
    print("[Database] No Supabase credentials configured. Running in demo mode with in-memory store.")

# Default demo user ID
DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"

# Initial seed data for fallback mode (PRD German Pacemaker imported into India, US Orthopedic, EU Analyzer)
_in_memory_devices: Dict[str, Dict[str, Any]] = {
    "11111111-1111-1111-1111-111111111111": {
        "id": "11111111-1111-1111-1111-111111111111",
        "user_id": DEMO_USER_ID,
        "name": "CardioPulse Dual-Chamber Pacemaker",
        "model_number": "CP-420-X",
        "manufacturer": "Berlin MedTech AG (Berlin, Germany)",
        "country_of_origin": "Germany",
        "intended_market": "India",
        "importer_name": "Arogya MedTech India Private Limited",
        "importer_address": "Plot 42, Okhla Industrial Area Phase III, New Delhi 110020, India (CDSCO Lic: IMP/MD/2024/00421)",
        "lot_number": "LOT-2024-GER01",
        "serial_number": "SN-8849201",
        "manufacturing_date": "2024-03-15",
        "expiry_date": "2029-03-14",
        "storage_conditions": "Store between 5°C and 25°C in dry conditions",
        "warnings_cautions": "MR Unsafe unless programmed. Contains lithium-iodine power source. Single use only.",
        "udi_di": "(01)04012345678901",
        "udi_pi": "(17)290314(10)LOT-2024-GER01(21)SN-8849201",
        "packaging_level": "primary",
        "language": "en",
        "created_at": "2024-03-15T09:00:00Z",
        "updated_at": "2024-03-15T09:00:00Z"
    },
    "22222222-2222-2222-2222-222222222222": {
        "id": "22222222-2222-2222-2222-222222222222",
        "user_id": DEMO_USER_ID,
        "name": "TitanFix Femoral Compression Plate System",
        "model_number": "TF-PLATE-8H",
        "manufacturer": "OrthoBiome Inc. (Memphis, TN, USA)",
        "country_of_origin": "USA",
        "intended_market": "USA",
        "importer_name": None,
        "importer_address": None,
        "lot_number": "LOT-US-9912",
        "serial_number": "SN-55219",
        "manufacturing_date": "2024-06-01",
        "expiry_date": "2029-05-31",
        "storage_conditions": "Store at ambient room temperature 15°C to 30°C",
        "warnings_cautions": "Rx Only. Caution: Federal law restricts this device to sale by or on the order of a physician.",
        "udi_di": "(01)00840123456784",
        "udi_pi": "(17)290531(10)LOT-US-9912",
        "packaging_level": "secondary",
        "language": "en",
        "created_at": "2024-06-01T10:30:00Z",
        "updated_at": "2024-06-01T10:30:00Z"
    },
    "33333333-3333-3333-3333-333333333333": {
        "id": "33333333-3333-3333-3333-333333333333",
        "user_id": DEMO_USER_ID,
        "name": "HemoSense Point-of-Care Coagulation Cartridge",
        "model_number": "HS-POC-100",
        "manufacturer": "BioDiagnostics SAS (Lyon, France)",
        "country_of_origin": "France",
        "intended_market": "EU",
        "importer_name": None,
        "importer_address": None,
        "lot_number": "LOT-EU-3301",
        "serial_number": "SN-POC-771",
        "manufacturing_date": "2024-09-10",
        "expiry_date": "2025-09-09",
        "storage_conditions": "Refrigerated storage required: 2°C to 8°C. Do not freeze.",
        "warnings_cautions": "In Vitro Diagnostic Medical Device. For professional healthcare use only. Single use.",
        "udi_di": "(01)03701234567895",
        "udi_pi": "(17)250909(10)LOT-EU-3301",
        "packaging_level": "primary",
        "language": "en",
        "created_at": "2024-09-10T14:15:00Z",
        "updated_at": "2024-09-10T14:15:00Z"
    }
}

_in_memory_projects: Dict[str, Dict[str, Any]] = {
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": {
        "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "user_id": DEMO_USER_ID,
        "device_id": "11111111-1111-1111-1111-111111111111",
        "title": "CardioPulse CDSCO Primary Blister Label",
        "destination_market": "India",
        "packaging_level": "primary",
        "version": "v1.0-draft",
        "status": "draft",
        "notes": "Initial draft for India destination market. Importer Arogya MedTech information and CDSCO licence format required.",
        "created_at": "2024-03-15T11:00:00Z",
        "updated_at": "2024-03-15T11:00:00Z"
    },
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": {
        "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        "user_id": DEMO_USER_ID,
        "device_id": "22222222-2222-2222-2222-222222222222",
        "title": "TitanFix FDA Outer Carton Secondary Label",
        "destination_market": "USA",
        "packaging_level": "secondary",
        "version": "v1.0-draft",
        "status": "in_review",
        "notes": "FDA 21 CFR 801 Rx Only warning and English language compliance verified.",
        "created_at": "2024-06-01T12:00:00Z",
        "updated_at": "2024-06-01T12:00:00Z"
    },
    "cccccccc-cccc-cccc-cccc-cccccccccccc": {
        "id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
        "user_id": DEMO_USER_ID,
        "device_id": "33333333-3333-3333-3333-333333333333",
        "title": "HemoSense EU MDR Sterile Barrier Label",
        "destination_market": "EU",
        "packaging_level": "primary",
        "version": "v1.0-draft",
        "status": "draft",
        "notes": "Sterile barrier packaging requirements and EU IVDR temperature indicator labels.",
        "created_at": "2024-09-10T16:00:00Z",
        "updated_at": "2024-09-10T16:00:00Z"
    }
}

# Stage 2 in-memory storage
_in_memory_label_versions: Dict[str, Dict[str, Any]] = {}
_in_memory_compliance_reports: Dict[str, Dict[str, Any]] = {}
_in_memory_label_comparisons: Dict[str, Dict[str, Any]] = {}

# Stage 3 in-memory storage — Review Queue & Immutable Audit Log
_in_memory_reviews: Dict[str, Dict[str, Any]] = {
    "rev-001": {
        "id": "rev-001",
        "project_id": "11111111-1111-1111-1111-111111111111",
        "reviewer_id": "22222222-2222-2222-2222-222222222222",
        "reviewer_name": "Dr. Marcus Vance",
        "reviewer_email": "reviewer@medlabel.ai",
        "decision": "approved",
        "comments": "Sourced compliance with CDSCO MDR 2017 Rule 109 verified. Authorized Indian Importer license details verified.",
        "version_tag": "v1.0-draft",
        "created_at": "2024-10-15T10:30:00Z"
    }
}

_in_memory_audit_logs: List[Dict[str, Any]] = [
    {
        "id": "aud-001",
        "actor_id": DEMO_USER_ID,
        "actor_email": "editor@medlabel.ai",
        "actor_name": "Dr. Priya Sharma",
        "actor_role": "editor",
        "action": "DEVICE_CREATED",
        "entity_type": "device",
        "entity_id": "dddddddd-dddd-dddd-dddd-dddddddddd01",
        "details": {"name": "CardioTrack Pacemaker Lead System", "market": "India"},
        "ip_address": "127.0.0.1",
        "created_at": "2024-09-01T08:00:00Z"
    },
    {
        "id": "aud-002",
        "actor_id": DEMO_USER_ID,
        "actor_email": "editor@medlabel.ai",
        "actor_name": "Dr. Priya Sharma",
        "actor_role": "editor",
        "action": "LABEL_GENERATED",
        "entity_type": "label_version",
        "entity_id": "11111111-1111-1111-1111-111111111111",
        "details": {"market": "India", "version_tag": "v1.0-draft"},
        "ip_address": "127.0.0.1",
        "created_at": "2024-09-01T09:15:00Z"
    },
    {
        "id": "aud-003",
        "actor_id": "22222222-2222-2222-2222-222222222222",
        "actor_email": "reviewer@medlabel.ai",
        "actor_name": "Dr. Marcus Vance",
        "actor_role": "reviewer",
        "action": "REVIEW_APPROVED",
        "entity_type": "review",
        "entity_id": "rev-001",
        "details": {"project_id": "11111111-1111-1111-1111-111111111111", "decision": "approved"},
        "ip_address": "127.0.0.1",
        "created_at": "2024-10-15T10:30:00Z"
    }
]

class DatabaseManager:
    """Unified Database Handler supporting both live Supabase and fast local fallback store."""

    @staticmethod
    def get_status() -> str:
        return "supabase_connected" if supabase_client else "local_mock_store"

    # ==========================================================================
    # Devices CRUD
    # ==========================================================================

    @staticmethod
    def list_devices(user_id: Optional[str] = None, market: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        if supabase_client is not None:
            query = supabase_client.table("devices").select("*")
            if user_id:
                query = query.eq("user_id", user_id)
            if market and market != "All":
                query = query.eq("intended_market", market)
            res = query.order("created_at", desc=True).execute()
            items = res.data or []
            if search:
                q = search.lower()
                items = [d for d in items if q in d.get("name", "").lower() or q in d.get("model_number", "").lower() or q in d.get("manufacturer", "").lower()]
            return items
        
        items = list(_in_memory_devices.values())
        if market and market != "All":
            items = [d for d in items if d.get("intended_market") == market]
        if search:
            q = search.lower()
            items = [d for d in items if q in d.get("name", "").lower() or q in d.get("model_number", "").lower() or q in d.get("manufacturer", "").lower()]
        return sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)

    @staticmethod
    def get_device(device_id: str) -> Optional[Dict[str, Any]]:
        if supabase_client is not None:
            res = supabase_client.table("devices").select("*").eq("id", device_id).execute()
            return res.data[0] if res.data else None
        return _in_memory_devices.get(device_id)

    @staticmethod
    def create_device(data: Dict[str, Any], user_id: str = DEMO_USER_ID) -> Dict[str, Any]:
        now_str = datetime.now(timezone.utc).isoformat()
        new_id = str(uuid.uuid4())
        record = {
            **data,
            "id": new_id,
            "user_id": user_id,
            "created_at": now_str,
            "updated_at": now_str
        }
        if supabase_client is not None:
            res = supabase_client.table("devices").insert(record).execute()
            return res.data[0] if res.data else record
        
        _in_memory_devices[new_id] = record
        return record

    @staticmethod
    def update_device(device_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        now_str = datetime.now(timezone.utc).isoformat()
        if supabase_client is not None:
            res = supabase_client.table("devices").update({**updates, "updated_at": now_str}).eq("id", device_id).execute()
            return res.data[0] if res.data else None
        
        device = _in_memory_devices.get(device_id)
        if not device:
            return None
        device.update({k: v for k, v in updates.items() if v is not None})
        device["updated_at"] = now_str
        return device

    @staticmethod
    def delete_device(device_id: str) -> bool:
        if supabase_client is not None:
            res = supabase_client.table("devices").delete().eq("id", device_id).execute()
            return True
        
        if device_id in _in_memory_devices:
            del _in_memory_devices[device_id]
            to_del = [pid for pid, p in _in_memory_projects.items() if p.get("device_id") == device_id]
            for pid in to_del:
                del _in_memory_projects[pid]
            return True
        return False

    # ==========================================================================
    # Label Projects CRUD
    # ==========================================================================

    @staticmethod
    def list_projects(user_id: Optional[str] = None, market: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        if supabase_client is not None:
            query = supabase_client.table("label_projects").select("*, devices(name, model_number)")
            if user_id:
                query = query.eq("user_id", user_id)
            if market and market != "All":
                query = query.eq("destination_market", market)
            if status and status != "All":
                query = query.eq("status", status)
            res = query.order("created_at", desc=True).execute()
            projects = []
            if res.data:
                for p in res.data:
                    dev = p.get("devices") or {}
                    p["device_name"] = dev.get("name")
                    p["device_model"] = dev.get("model_number")
                    projects.append(p)
            return projects
        
        projects = []
        for p in _in_memory_projects.values():
            if market and market != "All" and p.get("destination_market") != market:
                continue
            if status and status != "All" and p.get("status") != status:
                continue
            item = dict(p)
            dev = _in_memory_devices.get(p.get("device_id", ""))
            if dev:
                item["device_name"] = dev.get("name")
                item["device_model"] = dev.get("model_number")
            projects.append(item)
        return sorted(projects, key=lambda x: x.get("created_at", ""), reverse=True)

    @staticmethod
    def get_project(project_id: str) -> Optional[Dict[str, Any]]:
        if supabase_client is not None:
            res = supabase_client.table("label_projects").select("*, devices(name, model_number)").eq("id", project_id).execute()
            if res.data:
                p = res.data[0]
                dev = p.get("devices") or {}
                p["device_name"] = dev.get("name")
                p["device_model"] = dev.get("model_number")
                return p
            return None
        
        p = _in_memory_projects.get(project_id)
        if not p:
            return None
        item = dict(p)
        dev = _in_memory_devices.get(p.get("device_id", ""))
        if dev:
            item["device_name"] = dev.get("name")
            item["device_model"] = dev.get("model_number")
        return item

    @staticmethod
    def create_project(data: Dict[str, Any], user_id: str = DEMO_USER_ID) -> Dict[str, Any]:
        now_str = datetime.now(timezone.utc).isoformat()
        new_id = str(uuid.uuid4())
        record = {
            **data,
            "id": new_id,
            "user_id": user_id,
            "created_at": now_str,
            "updated_at": now_str
        }
        if supabase_client is not None:
            res = supabase_client.table("label_projects").insert(record).execute()
            p = res.data[0] if res.data else record
            dev_res = supabase_client.table("devices").select("name, model_number").eq("id", record["device_id"]).execute()
            if dev_res.data:
                p["device_name"] = dev_res.data[0].get("name")
                p["device_model"] = dev_res.data[0].get("model_number")
            return p

        _in_memory_projects[new_id] = record
        dev = _in_memory_devices.get(record["device_id"])
        res_record = dict(record)
        if dev:
            res_record["device_name"] = dev.get("name")
            res_record["device_model"] = dev.get("model_number")
        return res_record

    @staticmethod
    def update_project(project_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        now_str = datetime.now(timezone.utc).isoformat()
        if supabase_client is not None:
            res = supabase_client.table("label_projects").update({**updates, "updated_at": now_str}).eq("id", project_id).execute()
            if res.data:
                p = res.data[0]
                dev_res = supabase_client.table("devices").select("name, model_number").eq("id", p.get("device_id", "")).execute()
                if dev_res.data:
                    p["device_name"] = dev_res.data[0].get("name")
                    p["device_model"] = dev_res.data[0].get("model_number")
                return p
            return None
        
        p = _in_memory_projects.get(project_id)
        if not p:
            return None
        p.update({k: v for k, v in updates.items() if v is not None})
        p["updated_at"] = now_str
        item = dict(p)
        dev = _in_memory_devices.get(p.get("device_id", ""))
        if dev:
            item["device_name"] = dev.get("name")
            item["device_model"] = dev.get("model_number")
        return item

    @staticmethod
    def delete_project(project_id: str) -> bool:
        if supabase_client is not None:
            supabase_client.table("label_projects").delete().eq("id", project_id).execute()
            return True
        
        if project_id in _in_memory_projects:
            del _in_memory_projects[project_id]
            return True
        return False

    # ==========================================================================
    # Stage 2: Compliance Reports & Label Versions
    # ==========================================================================

    @staticmethod
    def save_compliance_report(report_data: Dict[str, Any], user_id: str = DEMO_USER_ID) -> Dict[str, Any]:
        now_str = datetime.now(timezone.utc).isoformat()
        new_id = str(uuid.uuid4())
        record = {
            "id": new_id,
            "user_id": user_id,
            "project_id": report_data.get("project_id") or "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "destination_market": report_data["summary"]["destination_market"],
            "total_checks": report_data["summary"]["total_checks"],
            "passed_checks": report_data["summary"]["passed_checks"],
            "failed_checks": report_data["summary"]["failed_checks"],
            "needs_review_checks": report_data["summary"]["needs_review_checks"],
            "results": report_data["results"],
            "summary": report_data["summary"],
            "created_at": now_str
        }

        if supabase_client is not None:
            res = supabase_client.table("compliance_reports").insert({
                "id": new_id,
                "user_id": user_id,
                "project_id": record["project_id"],
                "destination_market": record["destination_market"],
                "total_checks": record["total_checks"],
                "passed_checks": record["passed_checks"],
                "failed_checks": record["failed_checks"],
                "needs_review_checks": record["needs_review_checks"],
                "results": record["results"],
                "created_at": now_str
            }).execute()
            return res.data[0] if res.data else record

        _in_memory_compliance_reports[new_id] = record
        return record

    @staticmethod
    def list_compliance_reports(project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if supabase_client is not None:
            query = supabase_client.table("compliance_reports").select("*")
            if project_id:
                query = query.eq("project_id", project_id)
            res = query.order("created_at", desc=True).execute()
            return res.data or []
        
        items = list(_in_memory_compliance_reports.values())
        if project_id:
            items = [r for r in items if r.get("project_id") == project_id]
        return sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)

    @staticmethod
    def save_label_version(version_data: Dict[str, Any], user_id: str = DEMO_USER_ID) -> Dict[str, Any]:
        now_str = datetime.now(timezone.utc).isoformat()
        new_id = str(uuid.uuid4())
        record = {
            "id": new_id,
            "user_id": user_id,
            "project_id": version_data.get("project_id") or "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "version_tag": version_data.get("version_tag", "v1.0-draft"),
            "label_data": version_data.get("label_data", {}),
            "source_type": version_data.get("source_type", "ai_generated"),
            "pdf_watermarked": True,
            "created_at": now_str
        }

        if supabase_client is not None:
            res = supabase_client.table("label_versions").insert(record).execute()
            return res.data[0] if res.data else record

        _in_memory_label_versions[new_id] = record
        return record

    @staticmethod
    def list_label_versions(project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if supabase_client is not None:
            query = supabase_client.table("label_versions").select("*")
            if project_id:
                query = query.eq("project_id", project_id)
            res = query.order("created_at", desc=True).execute()
            return res.data or []
        
        items = list(_in_memory_label_versions.values())
        if project_id:
            items = [v for v in items if v.get("project_id") == project_id]
        return sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)

    @staticmethod
    def save_label_comparison(comparison_data: Dict[str, Any], user_id: str = DEMO_USER_ID) -> Dict[str, Any]:
        now_str = datetime.now(timezone.utc).isoformat()
        new_id = str(uuid.uuid4())
        record = {
            "id": new_id,
            "user_id": user_id,
            "project_id": comparison_data.get("project_id") or "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "base_label_name": comparison_data.get("base_name", "Original Label"),
            "target_label_name": comparison_data.get("revised_name", "Revised Label"),
            "field_changes": comparison_data.get("field_changes", []),
            "summary": comparison_data.get("summary", {}),
            "text_diff": comparison_data.get("text_diff", ""),
            "created_at": now_str
        }

        if supabase_client is not None:
            res = supabase_client.table("label_comparisons").insert({
                "id": new_id,
                "user_id": user_id,
                "project_id": record["project_id"],
                "base_label_name": record["base_label_name"],
                "target_label_name": record["target_label_name"],
                "field_changes": record["field_changes"],
                "text_diff": record["text_diff"],
                "critical_differences": record["summary"].get("critical_changes_detected", 0),
                "created_at": now_str
            }).execute()
            return res.data[0] if res.data else record

        _in_memory_label_comparisons[new_id] = record
        return record

    @staticmethod
    def list_label_comparisons(project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if supabase_client is not None:
            query = supabase_client.table("label_comparisons").select("*")
            if project_id:
                query = query.eq("project_id", project_id)
            res = query.order("created_at", desc=True).execute()
            return res.data or []
        
        items = list(_in_memory_label_comparisons.values())
        if project_id:
            items = [c for c in items if c.get("project_id") == project_id]
        return sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)

    @staticmethod
    def get_stats() -> Dict[str, Any]:
        devices = DatabaseManager.list_devices()
        projects = DatabaseManager.list_projects()

        market_counts = {"India": 0, "USA": 0, "EU": 0}
        pkg_counts = {"primary": 0, "secondary": 0, "shipper": 0}
        status_counts = {"draft": 0, "in_review": 0, "approved": 0, "rejected": 0, "changes_requested": 0}
        imported_count = 0

        for d in devices:
            m = d.get("intended_market")
            if m in market_counts:
                market_counts[m] += 1
            origin = (d.get("country_of_origin") or "").strip().lower()
            dest = (d.get("intended_market") or "").strip().lower()
            if origin and dest and origin != dest and (dest != "india" or origin != "india"):
                imported_count += 1

        for p in projects:
            pkg = p.get("packaging_level", "primary")
            if pkg in pkg_counts:
                pkg_counts[pkg] += 1
            st = p.get("status", "draft")
            if st in status_counts:
                status_counts[st] += 1

        return {
            "total_devices": len(devices),
            "total_projects": len(projects),
            "imported_devices_count": imported_count,
            "market_distribution": market_counts,
            "status_distribution": status_counts,
            "packaging_distribution": pkg_counts
        }

    # ==========================================================================
    # Stage 3: Review Queue & Approvals
    # ==========================================================================

    @staticmethod
    def create_review(review_data: Dict[str, Any]) -> Dict[str, Any]:
        now_str = datetime.now(timezone.utc).isoformat()
        new_id = str(uuid.uuid4())
        record = {
            "id": new_id,
            "project_id": review_data["project_id"],
            "reviewer_id": review_data.get("reviewer_id") or "22222222-2222-2222-2222-222222222222",
            "reviewer_name": review_data.get("reviewer_name") or "Dr. Marcus Vance",
            "reviewer_email": review_data.get("reviewer_email") or "reviewer@medlabel.ai",
            "decision": review_data["decision"],
            "comments": review_data.get("comments", ""),
            "version_tag": review_data.get("version_tag", "v1.0-draft"),
            "created_at": now_str
        }

        if supabase_client is not None:
            res = supabase_client.table("reviews").insert(record).execute()
            return res.data[0] if res.data else record

        _in_memory_reviews[new_id] = record
        return record

    @staticmethod
    def list_reviews(project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if supabase_client is not None:
            query = supabase_client.table("reviews").select("*")
            if project_id:
                query = query.eq("project_id", project_id)
            res = query.order("created_at", desc=True).execute()
            return res.data or []

        items = list(_in_memory_reviews.values())
        if project_id:
            items = [r for r in items if r.get("project_id") == project_id]
        return sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)

    # ==========================================================================
    # Stage 3: Append-Only Immutable Audit Log
    # ==========================================================================

    @staticmethod
    def log_audit_event(
        actor_email: str,
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        actor_name: Optional[str] = None,
        actor_role: str = "editor",
        details: Optional[Dict[str, Any]] = None,
        ip_address: str = "127.0.0.1"
    ) -> Dict[str, Any]:
        now_str = datetime.now(timezone.utc).isoformat()
        new_id = str(uuid.uuid4())
        record = {
            "id": new_id,
            "actor_id": actor_id or DEMO_USER_ID,
            "actor_email": actor_email,
            "actor_name": actor_name or ("Dr. Marcus Vance" if actor_role == "reviewer" else "Dr. Priya Sharma"),
            "actor_role": actor_role,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details or {},
            "ip_address": ip_address,
            "created_at": now_str
        }

        if supabase_client is not None:
            res = supabase_client.table("audit_logs").insert(record).execute()
            return res.data[0] if res.data else record

        _in_memory_audit_logs.insert(0, record)
        return record

    @staticmethod
    def list_audit_logs(
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        actor_email: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        if supabase_client is not None:
            query = supabase_client.table("audit_logs").select("*")
            if action and action != "All":
                query = query.eq("action", action)
            if entity_type and entity_type != "All":
                query = query.eq("entity_type", entity_type)
            if actor_email:
                query = query.eq("actor_email", actor_email)
            res = query.order("created_at", desc=True).limit(limit).execute()
            return res.data or []

        items = list(_in_memory_audit_logs)
        if action and action != "All":
            items = [a for a in items if a.get("action") == action]
        if entity_type and entity_type != "All":
            items = [a for a in items if a.get("entity_type") == entity_type]
        if actor_email:
            items = [a for a in items if a.get("actor_email") == actor_email]

        return items[:limit]
