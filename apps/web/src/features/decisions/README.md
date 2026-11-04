# Human Decision & Audit Workbench (`features/decisions`)

> **Assigned Engineer:** Pratham Kave (Frontend Lead)
> **Backend Counterpart:** Ayan (Backend Lead)

---

## 1. Feature Responsibility
- Mandatory human decision modal:
  - Three distinct decision actions: `APPROVE`, `REJECT`, or `REQUEST_CHANGES`.
  - Required reviewer name and feedback comments text area.
  - Summary of remaining open vs overridden issues.
- Decision confirmation badge & audit certificate display.
- Immutable audit log timeline viewer.

---

## 2. API Integration Points
- `POST /api/submissions/:id/decision`
- `GET /api/submissions/:id/audit-trail`

---

## 3. Files Owned by this Feature
- `apps/web/src/features/decisions/components/*`
- `apps/web/src/features/decisions/hooks/*`
- `apps/web/src/features/decisions/index.ts`
