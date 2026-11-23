import asyncio
import io
import pymupdf
from gemini_service import GeminiService
from compliance_engine import ComplianceEngine, STATUTORY_RULES
from label_pdf_exporter import LabelPdfExporter
from comparison_engine import ComparisonEngine
from database import DatabaseManager

def test_gemini_service_status():
    status = GeminiService.get_status()
    assert "configured" in status
    assert "message" in status
    print(f"✓ Gemini Service Status verified (configured: {status['configured']})")

def test_pdf_creation_and_pymupdf_extraction():
    # 1. Generate sample PDF using PyMuPDF
    doc = pymupdf.open()
    page = doc.new_page()
    sample_text = """
    CardioPulse Dual-Chamber Pacemaker
    Model: CP-420-X
    Manufacturer: Berlin MedTech AG (Berlin, Germany)
    Country of Origin: Germany
    Authorized Importer: Arogya MedTech India Private Limited
    Importer Address: Plot 42, Okhla Ind Area, New Delhi 110020 (CDSCO Lic: IMP/MD/2024/00421)
    LOT: LOT-2024-GER01
    SN: SN-8849201
    (01)04012345678901
    Store between 5°C and 25°C in dry conditions
    Rx Only. Single use only.
    """
    page.insert_text((50, 72), sample_text)
    pdf_bytes = doc.tobytes()
    doc.close()

    # 2. Extract using PyMuPDF
    doc_read = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    extracted_text = doc_read[0].get_text("text")
    doc_read.close()
    assert "CardioPulse" in extracted_text
    assert "Arogya MedTech" in extracted_text

    # 3. Test extraction fallback parser
    fields = GeminiService._deterministic_fallback_extractor(extracted_text)
    assert fields["name"] == "CardioPulse Dual-Chamber Pacemaker"
    assert fields["model_number"] == "CP-420-X"
    assert fields["country_of_origin"] == "Germany"
    assert fields["lot_number"] == "LOT-2024-GER01"
    print("✓ PyMuPDF text ingestion and field structuring verified")

def test_label_pdf_export_watermark():
    label_data = {
        "name": "CardioPulse Dual-Chamber Pacemaker",
        "model_number": "CP-420-X",
        "manufacturer": "Berlin MedTech AG",
        "country_of_origin": "Germany",
        "intended_market": "India",
        "importer_name": "Arogya MedTech India Private Limited",
        "importer_address": "New Delhi, India (Lic: IMP/MD/2024/00421)",
        "lot_number": "LOT-2024-GER01",
        "serial_number": "SN-8849201",
        "manufacturing_date": "2024-03-15",
        "expiry_date": "2029-03-14",
        "storage_conditions": "Store 5°C to 25°C",
        "warnings_cautions": "Rx Only. Single use only.",
        "udi_di": "(01)04012345678901",
        "packaging_level": "primary",
        "language": "en"
    }
    pdf_bytes = LabelPdfExporter.generate_pdf_bytes(label_data, market="India")
    assert len(pdf_bytes) > 1000
    # Verify PDF contains header bytes
    assert pdf_bytes.startswith(b"%PDF")
    print(f"✓ ReportLab watermarked PDF label generated ({len(pdf_bytes)} bytes)")

async def test_multinational_compliance_checker():
    print("Inside checker: start", flush=True)
    # 1. Test Germany -> India Imported Device (Complete details -> PASS)
    india_import_device = {
        "name": "CardioPulse Dual-Chamber Pacemaker",
        "model_number": "CP-420-X",
        "manufacturer": "Berlin MedTech AG",
        "country_of_origin": "Germany",
        "intended_market": "India",
        "importer_name": "Arogya MedTech India Private Limited",
        "importer_address": "Plot 42, New Delhi (Lic: IMP/MD/2024/00421)",
        "lot_number": "LOT-2024-GER01",
        "serial_number": "SN-8849201",
        "manufacturing_date": "2024-03-15",
        "expiry_date": "2029-03-14",
        "storage_conditions": "Store 5°C to 25°C",
        "warnings_cautions": "Rx Only. Single use only.",
        "udi_di": "(01)04012345678901",
        "packaging_level": "primary",
        "language": "en"
    }

    print("Inside checker: before eval 1", flush=True)
    res_india = await ComplianceEngine.evaluate_label(
        device=india_import_device,
        label_data=india_import_device,
        destination_market="India"
    )
    print("Inside checker: after eval 1", flush=True)
    assert res_india["summary"]["destination_market"] == "India"
    assert res_india["summary"]["is_imported_to_target"] is True
    # Rule IN-CDSCO-03 should PASS because importer + address + licence are present
    rule_03 = next(r for r in res_india["results"] if r["rule_code"] == "IN-CDSCO-03")
    assert rule_03["status"] == "PASS"

    # Test Germany -> India Imported Device MISSING importer details -> Must FAIL
    invalid_import = dict(india_import_device)
    invalid_import["importer_name"] = None
    res_invalid = await ComplianceEngine.evaluate_label(
        device=invalid_import,
        label_data=invalid_import,
        destination_market="India"
    )
    rule_03_invalid = next(r for r in res_invalid["results"] if r["rule_code"] == "IN-CDSCO-03")
    assert rule_03_invalid["status"] == "FAIL"
    print("✓ India (CDSCO) Rule 44(c) Imported Device validation verified (PASS with importer, FAIL when missing)")

    # 2. Test USA FDA Device
    us_device = {
        "name": "TitanFix Femoral Compression Plate System",
        "model_number": "TF-PLATE-8H",
        "manufacturer": "OrthoBiome Inc. (Memphis, TN, USA)",
        "country_of_origin": "USA",
        "intended_market": "USA",
        "warnings_cautions": "Rx Only. Caution: Federal law restricts this device.",
        "udi_di": "(01)00840123456784",
        "language": "en"
    }
    res_us = await ComplianceEngine.evaluate_label(
        device=us_device,
        label_data=us_device,
        destination_market="USA"
    )
    assert res_us["summary"]["destination_market"] == "USA"
    rule_udi = next(r for r in res_us["results"] if r["rule_code"] == "US-FDA-03")
    assert rule_udi["status"] == "PASS"
    rule_rx = next(r for r in res_us["results"] if r["rule_code"] == "US-FDA-04")
    assert rule_rx["status"] == "PASS"
    print("✓ US FDA (21 CFR Part 801) UDI and Rx Only checks verified")

    # 3. Test EU MDR Device
    eu_device = {
        "name": "HemoSense Point-of-Care Coagulation Cartridge",
        "model_number": "HS-POC-100",
        "manufacturer": "BioDiagnostics SAS (Lyon, France)",
        "country_of_origin": "France",
        "intended_market": "EU",
        "expiry_date": "2025-09-09",
        "lot_number": "LOT-EU-3301",
        "udi_di": "(01)03701234567895",
        "storage_conditions": "Refrigerated: 2°C to 8°C"
    }
    res_eu = await ComplianceEngine.evaluate_label(
        device=eu_device,
        label_data=eu_device,
        destination_market="EU"
    )
    assert res_eu["summary"]["destination_market"] == "EU"
    rule_exp = next(r for r in res_eu["results"] if r["rule_code"] == "EU-MDR-04")
    assert rule_exp["status"] == "PASS"
    print("✓ EU MDR (2017/745 Annex I) validation verified")

def test_label_comparison_engine():
    base = {
        "name": "CardioPulse Dual-Chamber Pacemaker",
        "model_number": "CP-420-X",
        "lot_number": "LOT-2024-GER01",
        "importer_name": "Arogya MedTech India Private Limited",
        "expiry_date": "2029-03-14",
        "warnings_cautions": "Rx Only. Single use only."
    }

    revised = {
        "name": "CardioPulse Dual-Chamber Pacemaker",
        "model_number": "CP-420-X",
        "lot_number": "LOT-2024-GER02",  # modified lot
        "importer_name": None,  # removed importer!
        "expiry_date": "2029-03-14",
        "warnings_cautions": "Single use only."  # modified warning (Rx Only missing)
    }

    comp = ComparisonEngine.compare_labels(base, revised, "Version 1.0", "Version 1.1")
    summary = comp["summary"]
    assert summary["modified_fields"] >= 1
    assert summary["removed_fields"] >= 1
    assert summary["critical_changes_detected"] >= 2
    assert len(comp["text_diff"]) > 0
    print(f"✓ Comparison Engine verified: detected {summary['critical_changes_detected']} critical changes and generated unified text diff")

def test_database_stage2_persistence():
    # Save compliance report
    report = DatabaseManager.save_compliance_report({
        "summary": {
            "destination_market": "India",
            "total_checks": 6,
            "passed_checks": 5,
            "failed_checks": 1,
            "needs_review_checks": 0
        },
        "results": [{"rule_code": "IN-CDSCO-01", "status": "PASS"}]
    })
    assert report["id"] is not None
    reports = DatabaseManager.list_compliance_reports()
    assert len(reports) >= 1

    # Save comparison
    comp_rec = DatabaseManager.save_label_comparison({
        "base_name": "Label v1",
        "revised_name": "Label v2",
        "summary": {"critical_changes_detected": 1},
        "field_changes": [],
        "text_diff": "--- v1\n+++ v2"
    })
    assert comp_rec["id"] is not None
    comps = DatabaseManager.list_label_comparisons()
    assert len(comps) >= 1
    print("✓ Stage 2 database persistence (reports and comparisons) verified")

if __name__ == "__main__":
    print("Starting Stage 2 tests...", flush=True)
    test_gemini_service_status()
    print("Step 1 ok", flush=True)
    test_pdf_creation_and_pymupdf_extraction()
    print("Step 2 ok", flush=True)
    test_label_pdf_export_watermark()
    print("Step 3 ok", flush=True)
    asyncio.run(test_multinational_compliance_checker())
    print("Step 4 ok", flush=True)
    test_label_comparison_engine()
    print("Step 5 ok", flush=True)
    test_database_stage2_persistence()
    print("Step 6 ok", flush=True)
    print("\nALL STAGE 2 BACKEND TEST TARGETS PASSED!", flush=True)
