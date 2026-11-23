# MedLabel AI

**Medical Device Regulatory Label Management & Automated Verification Platform**

MedLabel AI is an intelligent medical-device regulatory labeling assistant designed to draft, verify, compare, review, and track medical device labels across destination markets: **India (CDSCO)**, **USA (FDA 21 CFR Part 801)**, and **EU (MDR 2017/745)**.

---

> **Regulatory Notice:** MedLabel AI is a medical-device regulatory labeling assistance prototype platform. It provides automated drafting and rule-based verification support and does **not** constitute official regulatory approval or legal compliance certification under India CDSCO, US FDA, or EU MDR.

---

## Key Features

### 1. Medical Device & Project Management
- **Multi-Tenant Foundation:** Supabase Auth and PostgreSQL with Row Level Security (RLS) policies.
- **Traceability Identifiers:** UDI-DI, UDI-PI, Batch/Lot numbers, Serial numbers, manufacturing and expiry dates.
- **Market & Origin Routing:** Clear separation between country of manufacture and intended destination market (e.g., imported medical devices manufactured in Germany for distribution in India).

### 2. AI Label Generation & Ingestion
- **PDF & Image Ingestion:** Text layer extraction using PyMuPDF with structured statutory field proposals.
- **Backend-Only Google Gemini Integration:** Strict prompt controls prevent AI hallucination; missing statutory fields are tagged for human verification (`[NEEDS_REVIEW]`).
- **Deterministic Sourced Rules:** Curated regulatory rulebook catalog linking directly to statutory sections (India CDSCO Medical Devices Rules 2017 Rule 109, US FDA 21 CFR 801, EU MDR Annex I).
- **Watermarked PDF Export:** Generates standardized medical device labels with explicit prototype watermarks.
- **Side-by-Side Label Comparison:** Field-level diff and unified text diff detecting changed lot numbers, altered warnings, and modified importer addresses.

### 3. Formal Review & Approval Workflow
- **State Machine:** `Draft` → `In Review` → `Approved` / `Changes Requested` / `Rejected`.
- **Independent Review Enforcement:** Strict backend-level permission guard preventing self-approval (creators cannot approve their own label drafts).
- **Immutability of Approved Labels:** Approved label specifications are cryptographically stamped and locked against modifications or deletions.
- **Role-Based Access Control:** Distinct roles for `editor`, `reviewer`, and `admin`.

### 4. Append-Only Regulatory Audit Log
- **Tamper-Evident Trail:** Immutable chronological log recording device creations, AI label generation, compliance evaluations, reviewer comments, and approval decisions.
- **Full Traceability:** Captures actor email, role, action code, timestamp (UTC), entity type, and parameter changes.
- **Filtering & Audit Export:** Filter audit logs by action, entity type, and user email.

---

## Architecture

- **Frontend:** React 18 + Vite + TypeScript, custom medical design system with accessibility controls (font-scaling `-A`, `A`, `A+`, high-contrast mode), Lucide icons.
- **Backend:** FastAPI (Python 3.11+ / 3.13), Pydantic v2, PyMuPDF, ReportLab, httpx.
- **Database:** Supabase PostgreSQL with multi-tenant RLS, with an in-memory mock store fallback for standalone local execution.
- **AI Service:** Google Gemini API / Gemma (backend-only via environment variables).

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.11+
- (Optional) Supabase project URL & API keys
- (Optional) Google Gemini API Key

### 1. Configuration
Copy `.env.example` into `.env` and `backend/.env`:
```powershell
cp .env.example .env
cp .env.example backend/.env
```

Set your configuration variables:
```env
# Google Gemini API (Backend only — Optional)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (Optional — runs with local demo store if omitted)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Run Backend
```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
- API Health Check: `http://localhost:8000/api/health`
- Interactive Swagger Documentation: `http://localhost:8000/docs`

### 3. Run Frontend
```powershell
cd frontend
npm install
npm run dev
```
Accessible at: `http://localhost:5173`

---

## Testing

Run the automated test suite covering all Stage 1, Stage 2, and Stage 3 workflows:

```powershell
# Stage 1 Baseline Tests
python backend/test_backend.py

# Stage 2 AI, Ingestion & Compliance Tests
python backend/test_stage2.py

# Stage 3 End-to-End Review Workflow, Self-Approval Guards & Audit Trail Tests
python backend/test_stage3_e2e.py
```

---

## Regulatory Jurisdictions Supported

| Jurisdiction | Authority | Key Statutes Enforced |
|---|---|---|
| **India** | CDSCO | Medical Devices Rules (MDR) 2017, Rule 109, Rule 44(c) (Authorized Importer Mandate) |
| **USA** | FDA | 21 CFR Part 801 (General Device Labeling), 21 CFR 801.20 (UDI), 21 CFR 801.109 (Rx Only) |
| **European Union** | European Commission | Medical Device Regulation (EU) 2017/745 (MDR) Annex I Chapter III (Label and IFU) |

---

## License

MIT License. Designed and engineered for regulatory medical device labeling compliance demonstration.
