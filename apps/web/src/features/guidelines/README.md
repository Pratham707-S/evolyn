# Guideline Management Feature (`features/guidelines`)

> **Assigned Engineer:** Pratham Kave (Frontend Lead)
> **Backend Counterpart:** Mann (Guideline Knowledge Lead)

---

## 1. Feature Responsibility
- Document upload UI for PDF and Markdown brand guidelines.
- Raw text editor fallback with real-time character validation.
- Extracted rules viewer with category filters (`TONE`, `TERMINOLOGY`, `CLAIMS`, `LEGAL`).
- Conflict & Ambiguity alert panel showing contradictory rule pairs (Core Innovation 1).

---

## 2. API Integration Points
- `POST /api/guidelines` (Upload / Create)
- `GET /api/guidelines` (List)
- `GET /api/guidelines/:id` (Detail & extracted rules)
- `GET /api/guidelines/conflicts` (Detected conflicts)

---

## 3. Files Owned by this Feature
- `apps/web/src/features/guidelines/components/*`
- `apps/web/src/features/guidelines/hooks/*`
- `apps/web/src/features/guidelines/index.ts`
