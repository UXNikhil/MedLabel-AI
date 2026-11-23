# MedLabel AI — Product Requirements (v1.0)

**Purpose:** Build a working web app to draft, check, compare, review, and track **medical-device labels** for destination markets **India, USA, and EU**. This is an engineering prototype, **not** legal certification or an official government product.

**Development:** Google Antigravity; existing `html-template-4.zip` as visual reference; React + Vite + TypeScript frontend; FastAPI/Python backend; Supabase Auth/Postgres/private Storage; Gemini API (backend only); PyMuPDF for PDFs; optional OCR fallback. **No custom ML training.** Keep implementation lightweight for a Windows laptop; do not require Docker. **Do not push to GitHub until owner approves tested V1.**

## User journey
Sign in -> add device -> select **destination market** -> upload existing PDF or enter details -> confirm extracted data -> generate draft label -> run jurisdiction-specific checks -> compare old/new labels -> reviewer approves or requests changes -> export versioned PDF and audit log.

**Imported product example:** Made in Germany, intended for sale in India. Check applicable India/CDSCO requirements, including conditional importer information; *country of origin is not the destination market*. Do not automatically apply all EU rules to India-bound goods.

## Required features
1. **Login & roles:** Editor, Reviewer, Admin; enforce permissions in Supabase RLS and backend, not just UI.
2. **Dashboard & devices:** Save device name/model, manufacturer, origin, importer (if any), lot/serial, relevant dates, warnings, UDI *if supplied*, intended market, language, packaging level. Lists, edit and search.
3. **PDF ingestion & draft generation:** Upload PDF/image; extract text using PyMuPDF/OCR; Gemini proposes structured fields (user confirms). Render an editable **draft** label and export PDF. Never invent medical claims, identifiers, licence numbers or approval statements.
4. **Rule-based compliance assistant:** Apply curated **destination-market** rules sourced from official India CDSCO Medical Devices Rules, US FDA/21 CFR Part 801, EU MDR 2017/745. Store each rule's ID, precise source URL/section, market, applicability, verification date/status. Report `PASS`, `FAIL`, `NEEDS_REVIEW`, `NOT_APPLICABLE` with evidence and reason; unclear/unverified rules must not be marked PASS. AI may explain results but **cannot override deterministic checks**. Do not imply full regulatory coverage. Paid ISO standards cannot be treated as free complete rulebooks.
5. **Comparison:** Side-by-side old vs revised labels; highlight text/field differences (visual difference optional if reliable).
6. **Approval & traceability:** Draft -> in review -> approved/rejected; reviewer comments, immutable version snapshots, audit log, prototype-watermarked PDF. Never claim real FDA/CDSCO/CE approval.
7. **Change impact:** When device data changes, show which label variants/markets may require updates.
8. **Testing:** Synthetic examples for Germany->India import, US device, EU device; test missing fields, changed identifiers, wrong importer details, unknown rules, user separation; show working end-to-end demo.

## UI requirements
Use the uploaded `html-template-4.zip` (contains `html-template-4.html`, CSS, JS, images) for design language, accessibility and responsive layout. **It is a public website HTML template, not a ready dashboard**: adapt it to an original MedLabel AI dashboard. Remove Government of India emblems, UX4G official logos and any branding suggesting government endorsement; use only assets with acceptable usage rights. Main sections: Overview, Devices, Label Builder, Compliance Checks, Compare, Review Queue, Rule Library, Audit Log.

## Three stages — implement one at a time
**Stage 1 — Functional foundation:** React layout adapted from supplied template; Supabase auth and secure DB migrations/RLS; device and label-project CRUD; market/origin selection; functional navigation, loading/error states. Backend FastAPI health route + minimal CRUD/auth integration. **No Gemini, OCR or compliance checker yet.**

**Stage 2 — Core AI & validation:** Gemini configured through backend environment variables; PDF extraction and field confirmation; draft label PDF generation; curated rules for India/USA/EU (initial demo subset); deterministic rule checks with source links; old/new text comparison. Synthetic label test fixtures.

**Stage 3 — Complete workflow:** Reviewer approval and permissions, versions, audit trail, change-impact report; integration tests; security checks, UX polish and local demo. Only after owner approves V1: GitHub commit/push.

## Acceptance tests (V1)
- User signs in, adds an imported medical device and saves/reopens it.
- Draft label is generated from confirmed data; missing fields are visible, not fabricated.
- India/US/EU selector changes applicable rule checks; issues include source, reason and status.
- Old and new labels show meaningful differences; reviewer can approve/request changes.
- Version history is preserved, PDF exports, and different accounts cannot access each other's private records.
- App works locally; missing Gemini key produces a clear message rather than breaking non-AI features.

## Implementation constraints
- No mock-only fake 'working' features; Stage 1 may show **clearly disabled** future features.
- No secrets in frontend source, commits or logs; set keys in local `.env` and `.env.example` placeholders only. **User will configure Gemini API key at Stage 2; do not ask them to paste secrets into chat.**
- Do not rewrite working files unnecessarily. Prefer targeted tests and brief completion reports: files changed, how to run, blockers.
- Keep the longer 23-page PRD *outside Antigravity's context* unless a specific detail becomes essential.
