import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

supabase_client = None
if SUPABASE_URL and SUPABASE_KEY and "your-project" not in SUPABASE_URL:
    try:
        from supabase import create_client, Client
        supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[Database] Connected to live Supabase database.")
    except Exception as e:
        print(f"[Database] Warning: Supabase client init failed ({e}). Using local in-memory store.")
        supabase_client = None
else:
    print("[Database] No Supabase credentials configured. Using local in-memory mock store.")

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

class DatabaseManager:
    """Unified Database Handler supporting both live Supabase and fast local fallback store."""

    @staticmethod
    def get_status() -> str:
        return "supabase_connected" if supabase_client else "local_mock_store"

    @staticmethod
    def list_devices(user_id: Optional[str] = None, market: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        if supabase_client:
            try:
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
            except Exception as e:
                print(f"[DB Error] Falling back to local store: {e}")
        
        items = list(_in_memory_devices.values())
        if market and market != "All":
            items = [d for d in items if d.get("intended_market") == market]
        if search:
            q = search.lower()
            items = [d for d in items if q in d.get("name", "").lower() or q in d.get("model_number", "").lower() or q in d.get("manufacturer", "").lower()]
        return sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)

    @staticmethod
    def get_device(device_id: str) -> Optional[Dict[str, Any]]:
        if supabase_client:
            try:
                res = supabase_client.table("devices").select("*").eq("id", device_id).execute()
                if res.data:
                    return res.data[0]
            except Exception:
                pass
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
        if supabase_client:
            try:
                res = supabase_client.table("devices").insert(record).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[DB Insert Warning] {e}")
        
        _in_memory_devices[new_id] = record
        return record

    @staticmethod
    def update_device(device_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        now_str = datetime.now(timezone.utc).isoformat()
        if supabase_client:
            try:
                res = supabase_client.table("devices").update({**updates, "updated_at": now_str}).eq("id", device_id).execute()
                if res.data:
                    return res.data[0]
            except Exception:
                pass
        
        device = _in_memory_devices.get(device_id)
        if not device:
            return None
        device.update({k: v for k, v in updates.items() if v is not None})
        device["updated_at"] = now_str
        return device

    @staticmethod
    def delete_device(device_id: str) -> bool:
        if supabase_client:
            try:
                supabase_client.table("devices").delete().eq("id", device_id).execute()
                return True
            except Exception:
                pass
        
        if device_id in _in_memory_devices:
            del _in_memory_devices[device_id]
            to_del = [pid for pid, p in _in_memory_projects.items() if p.get("device_id") == device_id]
            for pid in to_del:
                del _in_memory_projects[pid]
            return True
        return False

    @staticmethod
    def list_projects(user_id: Optional[str] = None, market: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        projects = []
        if supabase_client:
            try:
                query = supabase_client.table("label_projects").select("*, devices(name, model_number)")
                if market and market != "All":
                    query = query.eq("destination_market", market)
                if status and status != "All":
                    query = query.eq("status", status)
                res = query.order("created_at", desc=True).execute()
                if res.data:
                    for p in res.data:
                        dev = p.get("devices") or {}
                        p["device_name"] = dev.get("name")
                        p["device_model"] = dev.get("model_number")
                        projects.append(p)
                    return projects
            except Exception as e:
                print(f"[DB Projects Warning] {e}")
        
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
        if supabase_client:
            try:
                res = supabase_client.table("label_projects").select("*, devices(name, model_number)").eq("id", project_id).execute()
                if res.data:
                    p = res.data[0]
                    dev = p.get("devices") or {}
                    p["device_name"] = dev.get("name")
                    p["device_model"] = dev.get("model_number")
                    return p
            except Exception:
                pass
        
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
        if supabase_client:
            try:
                res = supabase_client.table("label_projects").insert(record).execute()
                if res.data:
                    p = res.data[0]
                    dev = _in_memory_devices.get(record["device_id"])
                    if dev:
                        p["device_name"] = dev.get("name")
                        p["device_model"] = dev.get("model_number")
                    return p
            except Exception as e:
                print(f"[DB Project Insert Error] {e}")

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
        if supabase_client:
            try:
                res = supabase_client.table("label_projects").update({**updates, "updated_at": now_str}).eq("id", project_id).execute()
                if res.data:
                    return res.data[0]
            except Exception:
                pass
        
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
        if supabase_client:
            try:
                supabase_client.table("label_projects").delete().eq("id", project_id).execute()
                return True
            except Exception:
                pass
        
        if project_id in _in_memory_projects:
            del _in_memory_projects[project_id]
            return True
        return False

    @staticmethod
    def get_stats() -> Dict[str, Any]:
        devices = DatabaseManager.list_devices()
        projects = DatabaseManager.list_projects()

        market_counts = {"India": 0, "USA": 0, "EU": 0}
        pkg_counts = {"primary": 0, "secondary": 0, "shipper": 0}
        status_counts = {"draft": 0, "in_review": 0, "approved": 0, "rejected": 0}
        imported_count = 0

        for d in devices:
            m = d.get("intended_market")
            if m in market_counts:
                market_counts[m] += 1
            origin = (d.get("country_of_origin") or "").strip().lower()
            dest = (d.get("intended_market") or "").strip().lower()
            if origin and dest and origin != dest and origin != "india" if dest == "india" else origin != dest:
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
