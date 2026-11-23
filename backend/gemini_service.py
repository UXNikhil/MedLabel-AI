import os
import json
import re
from typing import Dict, Any, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

def get_gemini_key() -> str:
    load_dotenv()
    return os.getenv("GEMINI_API_KEY", "").strip()

class GeminiService:
    """Backend-only Gemini API integration for regulatory label structuring and advisory explanation.
    Never hallucinates or fabricates regulatory licence numbers, claims, or identifiers.
    Gracefully degrades with a clear configuration message when the API key is not configured.
    """

    @staticmethod
    def is_configured() -> bool:
        key = get_gemini_key()
        return bool(key and not key.startswith("your-") and len(key) > 10)

    @staticmethod
    def get_status() -> Dict[str, Any]:
        if GeminiService.is_configured():
            return {
                "configured": True,
                "model": "gemini-2.5-flash",
                "message": "Gemini AI is active for assisted field extraction and regulatory advisory."
            }
        return {
            "configured": False,
            "model": None,
            "message": "GEMINI_API_KEY is not configured in backend/.env. Non-AI deterministic checks, PyMuPDF extraction, and PDF generation remain fully functional. Set GEMINI_API_KEY to unlock AI-assisted field parsing and regulatory explanations."
        }

    @staticmethod
    async def extract_fields_from_text(raw_text: str) -> Dict[str, Any]:
        """Propose structured medical device fields from extracted PDF/label text.
        Marks missing or uncertain fields with [NEEDS_REVIEW]. Never invents data.
        """
        if not GeminiService.is_configured():
            # Deterministic regex-based fallback extractor
            return GeminiService._deterministic_fallback_extractor(raw_text)

        prompt = f"""
You are an expert medical-device regulatory labeling assistant.
Extract structured regulatory fields from the provided raw text extracted from a medical device label or packaging.

CRITICAL INSTRUCTIONS:
1. NEVER invent, fabricate, or assume medical claims, licence numbers, CE/FDA marks, approval numbers, or identifiers.
2. If a field is present in the text, extract its exact value.
3. If a field cannot be verified in the text with certainty, set its value to "[NEEDS_REVIEW]" or null.
4. Output strictly valid JSON matching the exact schema below.

Required JSON Schema:
{{
  "name": "string or [NEEDS_REVIEW]",
  "model_number": "string or [NEEDS_REVIEW]",
  "manufacturer": "string or [NEEDS_REVIEW]",
  "country_of_origin": "string or [NEEDS_REVIEW]",
  "importer_name": "string or null",
  "importer_address": "string or null",
  "lot_number": "string or null",
  "serial_number": "string or null",
  "manufacturing_date": "YYYY-MM-DD or string or null",
  "expiry_date": "YYYY-MM-DD or string or null",
  "storage_conditions": "string or null",
  "warnings_cautions": "string or null",
  "udi_di": "string or null",
  "udi_pi": "string or null",
  "packaging_level": "primary, secondary, or shipper",
  "language": "en",
  "uncertain_fields": ["list of field names requiring human confirmation"],
  "notes": "string explaining missing or uncertain statutory elements"
}}

Raw Label Text:
\"\"\"
{raw_text[:4000]}
\"\"\"
"""
        api_key = get_gemini_key()
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidate_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(candidate_text)
                    parsed["extraction_engine"] = "gemini-2.5-flash"
                    return parsed
                else:
                    print(f"[Gemini API Warning] HTTP {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[Gemini API Error] {e}")

        # Fallback if API call fails
        fallback = GeminiService._deterministic_fallback_extractor(raw_text)
        fallback["extraction_engine"] = "deterministic_fallback (Gemini API unavailable)"
        return fallback

    @staticmethod
    async def explain_compliance_finding(rule_code: str, rule_title: str, status: str, finding: str, jurisdiction: str) -> str:
        """Provide a concise statutory explanation and recommended corrective action for compliance check results."""
        if not GeminiService.is_configured():
            return f"Statutory requirement under {jurisdiction}. Ensure exact compliance with source regulations."

        prompt = f"""
Medical Device Regulation Assistant:
A deterministic compliance check was performed for destination market: {jurisdiction}.
Rule Code: {rule_code} ({rule_title})
Evaluation Status: {status}
Deterministic Finding: {finding}

Provide a concise, 2-3 sentence regulatory guidance explaining:
1. Why this requirement is mandatory under official {jurisdiction} rules (e.g., India CDSCO / US FDA 21 CFR 801 / EU MDR 2017/745).
2. The specific corrective action the manufacturer or regulatory editor must take on the label.
Do NOT claim that this AI advisory constitutes legal certification.
"""
        api_key = get_gemini_key()
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 200}
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            print(f"[Gemini Explain Warning] {e}")

        return f"Statutory requirement under {jurisdiction}. Verification status: {status}."

    @staticmethod
    def _deterministic_fallback_extractor(raw_text: str) -> Dict[str, Any]:
        """Regex and pattern-based deterministic extractor used when Gemini key is not configured."""
        uncertain_fields = []
        
        # Name detection
        name_match = re.search(r'(?:Device Name|Product Name|Product|Brand Name|Brand|Name)[:\s]+([^\n\r]+)', raw_text, re.IGNORECASE)
        name = name_match.group(1).strip() if name_match else None
        if not name:
            # Check first meaningful line
            lines = [l.strip() for l in raw_text.splitlines() if l.strip() and not l.strip().startswith("---") and len(l.strip()) > 3]
            if lines:
                name = lines[0]
            else:
                uncertain_fields.append("name")

        # Model Number
        model_match = re.search(r'(?:Model|REF|Catalog|Cat No|Type)[:\s#]+([A-Z0-9\-_/]+)', raw_text, re.IGNORECASE)
        model = model_match.group(1).strip() if model_match else None
        if not model:
            uncertain_fields.append("model_number")

        # Manufacturer
        mfg_match = re.search(r'(?:Manufacturer|Mfg by|Manufactured by)[:\s]+([^\n\r]+)', raw_text, re.IGNORECASE)
        mfg = mfg_match.group(1).strip() if mfg_match else None
        if not mfg:
            uncertain_fields.append("manufacturer")

        # Country of Origin
        origin_match = re.search(r'(?:Country of Origin|Made in|Origin)[:\s]+([^\n\r]+)', raw_text, re.IGNORECASE)
        origin = origin_match.group(1).strip() if origin_match else None
        if not origin:
            uncertain_fields.append("country_of_origin")

        # Importer
        imp_match = re.search(r'\b(?:Authorized Importer|Imported by|Importer)\b[:\s]+([^\n\r]+)', raw_text, re.IGNORECASE)
        importer = imp_match.group(1).strip() if imp_match else None

        # Lot Number
        lot_match = re.search(r'\b(?:LOT|Batch No|Batch)\b[:\s#]+([^\n\r]+)', raw_text, re.IGNORECASE)
        lot = lot_match.group(1).strip() if lot_match else None

        # Serial Number
        sn_match = re.search(r'\b(?:Serial No|Serial|SN)\b[:\s#]+([^\n\r]+)', raw_text, re.IGNORECASE)
        sn = sn_match.group(1).strip() if sn_match else None

        # UDI
        udi_match = re.search(r'(\(01\)\d{14}[^\n\r]*)', raw_text)
        udi = udi_match.group(1).strip() if udi_match else None

        # Storage
        storage_match = re.search(r'(?:Store|Storage|Temperature)[:\s]+([^\n\r]+)', raw_text, re.IGNORECASE)
        storage = storage_match.group(1).strip() if storage_match else None

        return {
            "name": name or "[NEEDS_REVIEW]",
            "model_number": model or "[NEEDS_REVIEW]",
            "manufacturer": mfg or "[NEEDS_REVIEW]",
            "country_of_origin": origin or "[NEEDS_REVIEW]",
            "importer_name": importer,
            "importer_address": None,
            "lot_number": lot,
            "serial_number": sn,
            "manufacturing_date": None,
            "expiry_date": None,
            "storage_conditions": storage,
            "warnings_cautions": "Rx Only. Read instructions before use." if "rx" in raw_text.lower() else None,
            "udi_di": udi,
            "udi_pi": None,
            "packaging_level": "primary",
            "language": "en",
            "uncertain_fields": uncertain_fields,
            "extraction_engine": "deterministic_fallback",
            "notes": "Extracted via deterministic pattern matcher. Please review and confirm fields."
        }
