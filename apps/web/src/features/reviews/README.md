# Interactive Review & Verification Feature (`features/reviews`)

> **Assigned Engineer:** Pratham Kave (Frontend Lead)
> **Backend Counterpart:** Ayan & Pratham

---

## 1. Feature Responsibility
- Side-by-side split screen inspection view:
  - **Left Pane:** Submitted text with interactive color-coded issue highlights (`charStart` to `charEnd`).
  - **Right Pane:** Selected issue card showing severity tag, explanation, suggested fix, verbatim source quote, and Claim Evidence Strength meter (Core Innovation 2).
- Issue filter controls (Filter by Critical, Warning, Suggestion, or Issue Type).
- Issue override checkbox with rationale note input.

---

## 2. API Integration Points
- `GET /api/submissions/:id/review` (Retrieve complete audit results and issues)
- `POST /api/submissions/:id/decision` (Submit final review decision)

---

## 3. Files Owned by this Feature
- `apps/web/src/features/reviews/components/*`
- `apps/web/src/features/reviews/hooks/*`
- `apps/web/src/features/reviews/index.ts`
