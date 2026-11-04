# Content Submission Studio (`features/submissions`)

> **Assigned Engineer:** Pratham Kave (Frontend Lead)
> **Backend Counterpart:** Ayan (Backend Lead)

---

## 1. Feature Responsibility
- Content submission interface for marketing, PR, and copywriters.
- Channel selection dropdown (`SOCIAL`, `PRESS_RELEASE`, `BLOG`, `AD_COPY`, `WEBSITE`, `EMAIL`).
- Submitter metadata and title input with Zod client-side pre-validation.
- "Audit with Evolyn" trigger button with progress loading states.

---

## 2. API Integration Points
- `POST /api/submissions` (Create)
- `GET /api/submissions` (List historical submissions)
- `POST /api/submissions/:id/analyze` (Trigger audit run)

---

## 3. Files Owned by this Feature
- `apps/web/src/features/submissions/components/*`
- `apps/web/src/features/submissions/hooks/*`
- `apps/web/src/features/submissions/index.ts`
