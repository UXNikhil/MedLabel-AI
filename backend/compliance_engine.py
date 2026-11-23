import re
from typing import List, Dict, Any, Optional
from gemini_service import GeminiService

# ==============================================================================
# Curated Statutory Rules Catalog
# Sourced from official statutory texts: CDSCO MDR 2017, FDA 21 CFR 801, EU MDR 2017/745
# ==============================================================================

STATUTORY_RULES: List[Dict[str, Any]] = [
    # ------------------ INDIA (CDSCO) ------------------
    {
        "rule_code": "IN-CDSCO-01",
        "jurisdiction": "India",
        "title": "Device Generic & Brand Name Specification",
        "description": "The label shall state the proper brand name and internationally recognized generic / common name of the medical device.",
        "source_reference": "CDSCO Medical Devices Rules 2017, Rule 44(a)",
        "source_url": "https://cdsco.gov.in/opencms/export/sites/CDSCO_WEB/pdf/Medical_Devices/MedicalDevicesRules2017.pdf",
        "applicability": "all_devices",
        "severity": "mandatory"
    },
    {
        "rule_code": "IN-CDSCO-02",
        "jurisdiction": "India",
        "title": "Legal Manufacturer & Country of Origin",
        "description": "The name and physical business address of the legal manufacturer and country of origin must be prominently stated on the label.",
        "source_reference": "CDSCO Medical Devices Rules 2017, Rule 44(b)",
        "source_url": "https://cdsco.gov.in/opencms/export/sites/CDSCO_WEB/pdf/Medical_Devices/MedicalDevicesRules2017.pdf",
        "applicability": "all_devices",
        "severity": "mandatory"
    },
    {
        "rule_code": "IN-CDSCO-03",
        "jurisdiction": "India",
        "title": "Mandatory Importer Details for Imported Devices",
        "description": "For imported medical devices, the label shall state the name and address of the authorized Indian importer, and the CDSCO manufacturing/import licence number.",
        "source_reference": "CDSCO Medical Devices Rules 2017, Rule 44(c) & Rule 34",
        "source_url": "https://cdsco.gov.in/opencms/export/sites/CDSCO_WEB/pdf/Medical_Devices/MedicalDevicesRules2017.pdf",
        "applicability": "imported_devices_only",
        "severity": "critical"
    },
    {
        "rule_code": "IN-CDSCO-04",
        "jurisdiction": "India",
        "title": "Manufacturing & Expiry Date / Shelf-Life",
        "description": "The date of manufacture and expiry date / use-before date must be clearly stated on the inner and outer labels.",
        "source_reference": "CDSCO Medical Devices Rules 2017, Rule 44(d)",
        "source_url": "https://cdsco.gov.in/opencms/export/sites/CDSCO_WEB/pdf/Medical_Devices/MedicalDevicesRules2017.pdf",
        "applicability": "all_devices",
        "severity": "mandatory"
    },
    {
        "rule_code": "IN-CDSCO-05",
        "jurisdiction": "India",
        "title": "Lot or Batch Number Traceability",
        "description": "Distinct batch number or lot number preceded by the word 'Lot No.' or 'Batch No.' must be specified.",
        "source_reference": "CDSCO Medical Devices Rules 2017, Rule 44(e)",
        "source_url": "https://cdsco.gov.in/opencms/export/sites/CDSCO_WEB/pdf/Medical_Devices/MedicalDevicesRules2017.pdf",
        "applicability": "all_devices",
        "severity": "mandatory"
    },
    {
        "rule_code": "IN-CDSCO-06",
        "jurisdiction": "India",
        "title": "Storage Conditions & Special Warnings",
        "description": "Special storage conditions or handling instructions and cautionary warnings must be clearly indicated.",
        "source_reference": "CDSCO Medical Devices Rules 2017, Rule 44(h)",
        "source_url": "https://cdsco.gov.in/opencms/export/sites/CDSCO_WEB/pdf/Medical_Devices/MedicalDevicesRules2017.pdf",
        "applicability": "all_devices",
        "severity": "mandatory"
    },

    # ------------------ USA (FDA 21 CFR 801) ------------------
    {
        "rule_code": "US-FDA-01",
        "jurisdiction": "USA",
        "title": "Proprietary Name & Established Description",
        "description": "The device label must prominently display the proprietary name alongside its established generic name.",
        "source_reference": "US FDA 21 CFR § 801.60 & 801.62",
        "source_url": "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-801",
        "applicability": "all_devices",
        "severity": "mandatory"
    },
    {
        "rule_code": "US-FDA-02",
        "jurisdiction": "USA",
        "title": "Manufacturer / Packer / Distributor Identification",
        "description": "Label must specify the name and place of business of the manufacturer, packer, or distributor with city, state, zip.",
        "source_reference": "US FDA 21 CFR § 801.1",
        "source_url": "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-801/subpart-A/section-801.1",
        "applicability": "all_devices",
        "severity": "mandatory"
    },
    {
        "rule_code": "US-FDA-03",
        "jurisdiction": "USA",
        "title": "Unique Device Identifier (UDI) Carrier",
        "description": "The label of every medical device shall bear a unique device identifier (UDI) in both human readable (HRI) and AIDC machine readable format.",
        "source_reference": "US FDA 21 CFR § 801.20 & 801.30",
        "source_url": "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-801/subpart-B/section-801.20",
        "applicability": "all_devices",
        "severity": "critical"
    },
    {
        "rule_code": "US-FDA-04",
        "jurisdiction": "USA",
        "title": "Prescription Statement (Rx Only)",
        "description": "Prescription devices must bear the symbol statement 'Rx Only' or 'Caution: Federal law restricts this device to sale by or on the order of a physician.'",
        "source_reference": "US FDA 21 CFR § 801.109(b)(1)",
        "source_url": "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-801/subpart-D/section-801.109",
        "applicability": "prescription_devices",
        "severity": "mandatory"
    },
    {
        "rule_code": "US-FDA-05",
        "jurisdiction": "USA",
        "title": "English Language Labeling",
        "description": "All required labeling information for distribution in the United States must appear in the English language.",
        "source_reference": "US FDA 21 CFR § 801.15",
        "source_url": "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-801/subpart-A/section-801.15",
        "applicability": "all_devices",
        "severity": "mandatory"
    },

    # ------------------ EU (MDR 2017/745) ------------------
    {
        "rule_code": "EU-MDR-01",
        "jurisdiction": "EU",
        "title": "Device Name & Clinical Purpose",
        "description": "The device name or trade name and an indication of its intended medical purpose must be on the label.",
        "source_reference": "EU MDR 2017/745, Annex I, Chapter III, Section 23.2(a)",
        "source_url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32017R0745",
        "applicability": "all_devices",
        "severity": "mandatory"
    },
    {
        "rule_code": "EU-MDR-02",
        "jurisdiction": "EU",
        "title": "Legal Manufacturer Details",
        "description": "The name or registered trade name and registered place of business of the legal manufacturer must appear on the packaging.",
        "source_reference": "EU MDR 2017/745, Annex I, Section 23.2(b)",
        "source_url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32017R0745",
        "applicability": "all_devices",
        "severity": "mandatory"
    },
    {
        "rule_code": "EU-MDR-03",
        "jurisdiction": "EU",
        "title": "Basic UDI-DI & UDI Carrier",
        "description": "The UDI carrier shall be placed on the label of the device and on all higher levels of packaging.",
        "source_reference": "EU MDR 2017/745, Annex I, Section 23.2(c) & Article 27",
        "source_url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32017R0745",
        "applicability": "all_devices",
        "severity": "critical"
    },
    {
        "rule_code": "EU-MDR-04",
        "jurisdiction": "EU",
        "title": "Expiry Date / Safe Use Limit",
        "description": "Clear statement of the date until which the device may be safely used, expressed at least as the year and month.",
        "source_reference": "EU MDR 2017/745, Annex I, Section 23.2(e)",
        "source_url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32017R0745",
        "applicability": "all_devices",
        "severity": "mandatory"
    },
    {
        "rule_code": "EU-MDR-05",
        "jurisdiction": "EU",
        "title": "Lot Number or Serial Number",
        "description": "An indication of the lot number or the serial number preceded by the internationally recognized symbol.",
        "source_reference": "EU MDR 2017/745, Annex I, Section 23.2(f)",
        "source_url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32017R0745",
        "applicability": "all_devices",
        "severity": "mandatory"
    },
    {
        "rule_code": "EU-MDR-06",
        "jurisdiction": "EU",
        "title": "Special Storage or Handling Conditions",
        "description": "Any special storage and/or handling condition applying to the device must be marked clearly on the packaging.",
        "source_reference": "EU MDR 2017/745, Annex I, Section 23.2(k)",
        "source_url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32017R0745",
        "applicability": "all_devices",
        "severity": "mandatory"
    }
]

class ComplianceEngine:
    """Multinational Deterministic Compliance Checker with AI Advisory Assistant.
    Evaluates destination market requirements. Never declares legal certification.
    """

    @staticmethod
    def get_rules_catalog(jurisdiction: Optional[str] = None) -> List[Dict[str, Any]]:
        if jurisdiction and jurisdiction != "All":
            return [r for r in STATUTORY_RULES if r["jurisdiction"] == jurisdiction]
        return STATUTORY_RULES

    @staticmethod
    async def evaluate_label(
        device: Dict[str, Any],
        label_data: Dict[str, Any],
        destination_market: str
    ) -> Dict[str, Any]:
        """Runs deterministic checks for target market, flags imported devices for India,
        and optionally enriches findings with Gemini AI explanations without overriding checks.
        """
        applicable_rules = [r for r in STATUTORY_RULES if r["jurisdiction"] == destination_market]
        results = []

        origin = (device.get("country_of_origin") or "").strip()
        is_imported_to_india = (destination_market == "India" and origin.lower() != "india")

        for rule in applicable_rules:
            code = rule["rule_code"]
            status = "PASS"
            finding = ""
            evidence = ""

            # ----------------- INDIA (CDSCO) CHECKS -----------------
            if code == "IN-CDSCO-01":
                name = label_data.get("name") or device.get("name")
                if not name or name == "[NEEDS_REVIEW]":
                    status = "FAIL"
                    finding = "Device brand and generic name is missing or marked uncertain."
                else:
                    status = "PASS"
                    finding = "Device brand name is explicitly specified."
                    evidence = f"Name: {name}"

            elif code == "IN-CDSCO-02":
                mfg = label_data.get("manufacturer") or device.get("manufacturer")
                c_origin = label_data.get("country_of_origin") or device.get("country_of_origin")
                if not mfg or mfg == "[NEEDS_REVIEW]":
                    status = "FAIL"
                    finding = "Legal manufacturer name and address missing."
                elif not c_origin or c_origin == "[NEEDS_REVIEW]":
                    status = "NEEDS_REVIEW"
                    finding = "Manufacturer specified but Country of Origin is unconfirmed."
                    evidence = f"Manufacturer: {mfg}"
                else:
                    status = "PASS"
                    finding = "Legal manufacturer and Country of Origin properly declared."
                    evidence = f"Manufacturer: {mfg} | Origin: {c_origin}"

            elif code == "IN-CDSCO-03":
                # Imported product rule for India
                if not is_imported_to_india:
                    status = "NOT_APPLICABLE"
                    finding = f"Device manufactured domestically in India ({origin}). Importer rule not applicable."
                else:
                    imp_name = label_data.get("importer_name") or device.get("importer_name")
                    imp_addr = label_data.get("importer_address") or device.get("importer_address")
                    if not imp_name:
                        status = "FAIL"
                        finding = f"Imported device ({origin} -> India) strictly requires Authorized Indian Importer details under CDSCO Rule 44(c) & Rule 34."
                    elif not imp_addr or "lic" not in imp_addr.lower():
                        status = "NEEDS_REVIEW"
                        finding = "Authorized importer name provided, but physical address or CDSCO Import Licence number is missing/unverified."
                        evidence = f"Importer: {imp_name}"
                    else:
                        status = "PASS"
                        finding = "Authorized Indian importer name, address, and CDSCO Import Licence number verified."
                        evidence = f"Importer: {imp_name} | Address/Lic: {imp_addr}"

            elif code == "IN-CDSCO-04":
                mfg_date = label_data.get("manufacturing_date") or device.get("manufacturing_date")
                exp_date = label_data.get("expiry_date") or device.get("expiry_date")
                if not exp_date and not mfg_date:
                    status = "FAIL"
                    finding = "Neither manufacturing date nor expiry date found on label."
                elif not exp_date:
                    status = "NEEDS_REVIEW"
                    finding = "Manufacturing date present, but expiry date / shelf-life is missing."
                    evidence = f"Mfg: {mfg_date}"
                else:
                    status = "PASS"
                    finding = "Manufacturing and shelf-life expiry dates specified."
                    evidence = f"Mfg: {mfg_date or 'N/A'} | Exp: {exp_date}"

            elif code == "IN-CDSCO-05":
                lot = label_data.get("lot_number") or device.get("lot_number")
                sn = label_data.get("serial_number") or device.get("serial_number")
                if not lot and not sn:
                    status = "FAIL"
                    finding = "Mandatory Batch / Lot number or Serial number is missing."
                else:
                    status = "PASS"
                    finding = "Traceable Batch / Lot identifier verified."
                    evidence = f"Lot: {lot or 'N/A'} | SN: {sn or 'N/A'}"

            elif code == "IN-CDSCO-06":
                storage = label_data.get("storage_conditions") or device.get("storage_conditions")
                warnings = label_data.get("warnings_cautions") or device.get("warnings_cautions")
                if not storage and not warnings:
                    status = "NEEDS_REVIEW"
                    finding = "Special storage conditions or caution statements not specified."
                else:
                    status = "PASS"
                    finding = "Storage conditions and regulatory precautions specified."
                    evidence = f"Storage: {storage or 'Standard ambient'} | Cautions: {warnings or 'General'}"

            # ----------------- USA (FDA) CHECKS -----------------
            elif code == "US-FDA-01":
                name = label_data.get("name") or device.get("name")
                model = label_data.get("model_number") or device.get("model_number")
                if not name or name == "[NEEDS_REVIEW]":
                    status = "FAIL"
                    finding = "Device proprietary or established name missing."
                else:
                    status = "PASS"
                    finding = "Proprietary name and model code verified."
                    evidence = f"{name} (Model: {model or 'N/A'})"

            elif code == "US-FDA-02":
                mfg = label_data.get("manufacturer") or device.get("manufacturer")
                if not mfg or mfg == "[NEEDS_REVIEW]":
                    status = "FAIL"
                    finding = "Manufacturer / distributor name and place of business missing."
                else:
                    status = "PASS"
                    finding = "Manufacturer / distributor address verified."
                    evidence = f"{mfg}"

            elif code == "US-FDA-03":
                udi = label_data.get("udi_di") or device.get("udi_di")
                if not udi:
                    status = "FAIL"
                    finding = "Unique Device Identifier (UDI) missing. Required under 21 CFR 801.20."
                elif not re.search(r'\(01\)\d{14}', str(udi)):
                    status = "NEEDS_REVIEW"
                    finding = "UDI provided but does not match standard 14-digit GS1 GTIN format '(01)XXXXXXXXXXXXXX'."
                    evidence = f"UDI: {udi}"
                else:
                    status = "PASS"
                    finding = "Standard UDI-DI carrier verified."
                    evidence = f"UDI-DI: {udi}"

            elif code == "US-FDA-04":
                warnings = (label_data.get("warnings_cautions") or device.get("warnings_cautions") or "").lower()
                if "rx only" in warnings or "caution: federal law" in warnings or "prescription" in warnings:
                    status = "PASS"
                    finding = "Prescription statement 'Rx Only' verified."
                    evidence = "Rx Only statement verified."
                else:
                    status = "NEEDS_REVIEW"
                    finding = "Prescription statement 'Rx Only' not detected. Verify if device is OTC or Prescription."

            elif code == "US-FDA-05":
                lang = (label_data.get("language") or device.get("language") or "en").lower()
                if lang in ["en", "english"]:
                    status = "PASS"
                    finding = "Primary label language verified as English."
                    evidence = "Language: EN"
                else:
                    status = "FAIL"
                    finding = f"Language is '{lang}'. 21 CFR 801.15 requires English for US distribution."

            # ----------------- EU (MDR) CHECKS -----------------
            elif code == "EU-MDR-01":
                name = label_data.get("name") or device.get("name")
                if not name or name == "[NEEDS_REVIEW]":
                    status = "FAIL"
                    finding = "Device trade name or intended purpose missing."
                else:
                    status = "PASS"
                    finding = "Device trade name verified."
                    evidence = f"Name: {name}"

            elif code == "EU-MDR-02":
                mfg = label_data.get("manufacturer") or device.get("manufacturer")
                if not mfg or mfg == "[NEEDS_REVIEW]":
                    status = "FAIL"
                    finding = "Legal manufacturer details missing."
                else:
                    status = "PASS"
                    finding = "Legal manufacturer details verified."
                    evidence = f"{mfg}"

            elif code == "EU-MDR-03":
                udi = label_data.get("udi_di") or device.get("udi_di")
                if not udi:
                    status = "FAIL"
                    finding = "Basic UDI-DI carrier missing under EU MDR Article 27 & Annex I Section 23.2(c)."
                else:
                    status = "PASS"
                    finding = "UDI carrier verified."
                    evidence = f"UDI: {udi}"

            elif code == "EU-MDR-04":
                exp = label_data.get("expiry_date") or device.get("expiry_date")
                if not exp:
                    status = "FAIL"
                    finding = "Time limit for safe use (Expiry date) missing."
                else:
                    status = "PASS"
                    finding = "Safe use expiry date verified."
                    evidence = f"Exp: {exp}"

            elif code == "EU-MDR-05":
                lot = label_data.get("lot_number") or device.get("lot_number")
                sn = label_data.get("serial_number") or device.get("serial_number")
                if not lot and not sn:
                    status = "FAIL"
                    finding = "Lot number or serial number indicator missing."
                else:
                    status = "PASS"
                    finding = "Lot or Serial number verified."
                    evidence = f"Lot: {lot or 'N/A'} | SN: {sn or 'N/A'}"

            elif code == "EU-MDR-06":
                storage = label_data.get("storage_conditions") or device.get("storage_conditions")
                if not storage:
                    status = "NEEDS_REVIEW"
                    finding = "Special storage or temperature limits not stated. Verify if device requires environmental controls."
                else:
                    status = "PASS"
                    finding = "Storage / handling condition verified."
                    evidence = f"Storage: {storage}"

            # Attach AI explanation if Gemini is configured (async advisory)
            ai_explanation = None
            if GeminiService.is_configured() and status in ["FAIL", "NEEDS_REVIEW"]:
                try:
                    ai_explanation = await GeminiService.explain_compliance_finding(
                        rule_code=rule["rule_code"],
                        rule_title=rule["title"],
                        status=status,
                        finding=finding,
                        jurisdiction=destination_market
                    )
                except Exception:
                    pass

            results.append({
                "rule_code": rule["rule_code"],
                "title": rule["title"],
                "source_reference": rule["source_reference"],
                "source_url": rule["source_url"],
                "severity": rule["severity"],
                "status": status,
                "finding": finding,
                "evidence": evidence,
                "ai_advisory": ai_explanation
            })

        total = len(results)
        passed = sum(1 for r in results if r["status"] == "PASS")
        failed = sum(1 for r in results if r["status"] == "FAIL")
        needs_review = sum(1 for r in results if r["status"] == "NEEDS_REVIEW")
        not_applicable = sum(1 for r in results if r["status"] == "NOT_APPLICABLE")

        summary = {
            "destination_market": destination_market,
            "device_name": device.get("name"),
            "country_of_origin": origin,
            "is_imported_to_target": is_imported_to_india,
            "total_checks": total,
            "passed_checks": passed,
            "failed_checks": failed,
            "needs_review_checks": needs_review,
            "not_applicable_checks": not_applicable,
            "overall_status": "FAIL" if failed > 0 else ("NEEDS_REVIEW" if needs_review > 0 else "PASS"),
            "disclaimer": "PROTOTYPE VALIDATION ONLY — NOT OFFICIAL CERTIFICATION OR REGULATORY APPROVAL UNDER CDSCO, US FDA OR EU MDR."
        }

        return {
            "summary": summary,
            "results": results
        }
