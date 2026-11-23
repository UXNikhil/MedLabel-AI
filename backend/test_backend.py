from main import get_health, get_stats, list_devices, create_device, delete_device, list_projects, create_project, delete_project
from models import DeviceCreate, LabelProjectCreate

def run_tests():
    # 1. Health
    h = get_health()
    assert h.status == "healthy"
    assert h.stage == "Stage 1 — Functional Foundation"
    print("✓ Health endpoint returned healthy status")

    # 2. Stats
    s = get_stats()
    assert s["total_devices"] >= 3
    assert s["total_projects"] >= 3
    assert "India" in s["market_distribution"]
    print(f"✓ Stats returned: {s['total_devices']} devices, {s['total_projects']} projects")

    # 3. Devices
    devs = list_devices()
    assert len(devs) >= 3
    new_dev = create_device(DeviceCreate(
        name="Test Pacemaker Electrode",
        model_number="PE-101",
        manufacturer="Berlin MedTech AG",
        country_of_origin="Germany",
        intended_market="India",
        importer_name="Arogya MedTech India Pvt Ltd",
        importer_address="New Delhi, India",
        packaging_level="primary",
        language="en"
    ))
    assert new_dev["name"] == "Test Pacemaker Electrode"
    delete_device(new_dev["id"])
    print("✓ Device CRUD verified")

    # 4. Projects
    first_dev_id = devs[0]["id"]
    new_proj = create_project(LabelProjectCreate(
        device_id=first_dev_id,
        title="Test Packaging Label",
        destination_market="India",
        packaging_level="primary",
        version="v1.0-draft",
        status="draft",
        notes="Automated test note"
    ))
    assert new_proj["title"] == "Test Packaging Label"
    delete_project(new_proj["id"])
    print("✓ Label Project CRUD verified")
    print("ALL BACKEND STAGE 1 CHECKS PASSED!")

if __name__ == "__main__":
    run_tests()
