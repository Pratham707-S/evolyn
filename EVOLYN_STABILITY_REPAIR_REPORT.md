# EVOLYN — CRITICAL STABILITY, SAVE, AI ANALYSIS, EDITOR & PDF REPAIR REPORT

**Date:** 07 November 2026  
**Status:** Completed & Verified  
**Active Services:**
- Express API: `http://localhost:5001` (Connected to Neon DB + Gemini 3.8 / `gemini-3.8-flash`)
- Next.js Web: `http://localhost:3000`

---

## 1. Executive Summary & Root Cause Audit

| Area | Observed Symptom | Actual Root Cause | Fix Applied | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Save Revision (P0)** | `Save failed: API request timed out after 15000ms: /api/submissions/:id/analyze` | "Save Revision" button called `/api/submissions/:id/analyze` instead of a database persistence endpoint. `/analyze` performed heavy embedding generation + Google API calls exceeding 15 seconds. | 1. Added dedicated `PUT /api/submissions/:id` & `PATCH /api/submissions/:id` routes and repository methods in `@evolyn/api`.<br>2. Decoupled `saveMutation` in `apps/web/src/app/reviews/page.tsx` to directly persist rawText and update status to `REVIEWED` (< 30ms response). | **Resolved & Tested** |
| **AI Findings & Auto-Audit (P0)** | 0 active findings / "No Issues in this Category" on new submissions | 1. `hasAutoAudited` state was a single boolean not keyed by submission ID; once toggled, subsequent submissions never triggered an audit.<br>2. `ReviewAiPanel` was missing `auditError`, `hasReviewRun`, and `complianceScore` props, defaulting `hasReviewRun` to true even when no audit had ever run. | 1. Refactored auto-audit to use `auditedSubmissionsRef = useRef<Set<string>>` to track audits per submission ID.<br>2. Passed `auditError`, `hasReviewRun`, and `complianceScore` into `ReviewAiPanel` to render distinct states (Error/Timeout, Clean 100%, Pending Audit, and Active Findings). | **Resolved & Tested** |
| **Gemini JSON Parse / Rewrite (P0)** | `Rewrite failed: Gemini returned invalid JSON for the rewrite` | Large documents (e.g. 5,000+ chars in `novara_brand_guidelines_test`) caused token truncation in single-turn JSON responses. Inverted JSON keys (`rationale` before `rewrittenText`) and unescaped quotes broke strict JSON regex matching. | 1. Enforced 4,000 char bounded context in `reviews.service.ts`.<br>2. Enhanced `parseJsonFromCandidateText` in `gemini.provider.ts` to support inverted keys, unescaped quote literals, truncated JSON salvage, and raw prose extraction.<br>3. Increased frontend rewrite timeout to 60s. | **Resolved & Tested** |
| **Editor Formatting & Selection (P0)** | H1, H2, Bold, Lists lost on save or dropped selection on click | 1. Toolbar buttons lacked `e.preventDefault()`, causing mousedown to steal focus from TipTap and deselect text.<br>2. `saveMutation` was passing plaintext `editor.getText()` instead of HTML `editor.getHTML()`.<br>3. `cleanAndFormatPdfToHtml` stripped existing HTML tags. | 1. Added `onMouseDown={(e) => e.preventDefault()}` to all formatting buttons.<br>2. Updated `handleSave` to preserve `editor.getHTML()`.<br>3. Updated `cleanAndFormatPdfToHtml` to preserve existing `<h1>`, `<h2>`, `<h3>`, `<ul>`, `<ol>`, `<p>`, `<div>` blocks. | **Resolved & Tested** |
| **PDF Viewer Zoom Jitter & Noise (P0)** | Zoom jitter, white page flashes, and delimiter leakage (`-- 1 of 5 --`) | Dynamic React key `key={`${fileUrl}-page-${currentPage}-zoom-${pdfZoom}`}` forced complete iframe unmount and remount on every zoom or page change. Raw page delimiters leaked into editable text. | 1. Replaced dynamic key with stable `key={fileUrl \|\| 'pdf-viewer'}`.<br>2. Cleaned page delimiters into styled `Page N Reference` badges. | **Resolved & Tested** |
| **Initial Loading / UI Flash (P1)** | White screen with center spinner flashed before 3-column layout hydrated | Loading state in `reviews/page.tsx` rendered a bare center spinner that replaced the entire layout. | Created `ReviewWorkspaceSkeleton` matching the exact 3-column layout and olive colorway; used for both `if (isLoading)` and `<Suspense fallback={...}>`. | **Resolved & Tested** |
| **Brand Identity & Model Labeling** | Raw "Gemini 3.8 AI Tools" displayed instead of Evolyn Brand AI | UI copy exposed underlying foundation model name rather than Evolyn platform branding. | Rebranded sidebar to `Evolyn AI Writing Tools` and modal headers to `Evolyn AI Rewrite` & `Evolyn AI Proposal`. | **Resolved & Tested** |

---

## 2. Files Modified & Added

### Backend (`apps/api`):
1. [submissions.repository.ts](file:///Users/pratham/evolyn/apps/api/src/modules/submissions/submissions.repository.ts): Added `update(id, input)` method to persist revised text, title, and status.
2. [submissions.service.ts](file:///Users/pratham/evolyn/apps/api/src/modules/submissions/submissions.service.ts): Added `updateSubmission` method with length validation.
3. [submissions.controller.ts](file:///Users/pratham/evolyn/apps/api/src/modules/submissions/submissions.controller.ts): Added `update` controller action handling `PUT` and `PATCH`.
4. [submissions.routes.ts](file:///Users/pratham/evolyn/apps/api/src/modules/submissions/submissions.routes.ts): Registered `PUT /:id` and `PATCH /:id` routes.
5. [gemini.provider.ts](file:///Users/pratham/evolyn/apps/api/src/infrastructure/ai/gemini.provider.ts): Enhanced candidate JSON parsing with fallback extraction for inverted keys, escaped quotes, and unescaped newlines.
6. [reviews.service.ts](file:///Users/pratham/evolyn/apps/api/src/modules/reviews/reviews.service.ts): Added bounded context (4,000 char limit) for rewrite operations.

### Frontend (`apps/web`):
1. [page.tsx](file:///Users/pratham/evolyn/apps/web/src/app/reviews/page.tsx):
   - Decoupled `saveMutation` to call `PUT /api/submissions/:id`.
   - Wired auto-audit with `useRef<Set<string>>` per submission.
   - Replaced bare loader with `<ReviewWorkspaceSkeleton />`.
   - Passed `auditError`, `hasReviewRun`, and `complianceScore` to `ReviewAiPanel`.
2. [review-editor.tsx](file:///Users/pratham/evolyn/apps/web/src/features/reviews/components/review-editor.tsx):
   - Added `onMouseDown={(e) => e.preventDefault()}` on all toolbar buttons.
   - Updated `handleSave` to save rich HTML markup.
   - Preserved HTML tags and styled page markers in `cleanAndFormatPdfToHtml`.
   - Replaced dynamic iframe key with stable key to prevent zoom jitter and white flashing.
3. [review-ai-panel.tsx](file:///Users/pratham/evolyn/apps/web/src/features/reviews/components/review-ai-panel.tsx):
   - Implemented 4 distinct states: (1) Active Findings cards with Apply Fix/Dismiss, (2) Clean 100% compliant, (3) Pending audit with "Run AI Governance Audit" button, (4) Audit Error/Timeout with "Retry Governance Audit" button.
4. [review-sidebar-tools.tsx](file:///Users/pratham/evolyn/apps/web/src/features/reviews/components/review-sidebar-tools.tsx):
   - Rebranded header to "Evolyn AI Writing Tools".
5. [review-workspace-skeleton.tsx](file:///Users/pratham/evolyn/apps/web/src/features/reviews/components/review-workspace-skeleton.tsx):
   - High-fidelity 3-column skeleton loader matching olive palette.

---

## 3. Test Verification & Evidence

1. **TypeScript Typecheck:**
   - `npm --workspace=@evolyn/web run typecheck`: **0 errors**
   - `npm --workspace=@evolyn/api run typecheck`: **0 errors**
2. **Backend Automated Tests:**
   - `npm --workspace=@evolyn/api test`: **287 passing tests** across 43 suites (0 failures).
3. **Database Persistence Endpoint Verification:**
   - `PUT /api/submissions/:id`: HTTP 200 in ~25ms with updated `raw_text` and `status: REVIEWED`.
4. **Gemini Rewrite Verification:**
   - `POST /api/submissions/:id/rewrite` with `"Evolyn eliminates 100% of brand compliance risk in seconds."`:
   - Output: `"Evolyn helps enterprise teams manage and mitigate brand compliance risks efficiently."`
   - Rationale: `"The original claim of 'eliminating 100% of risk' was removed to comply with brand safety guidelines prohibiting absolute guarantees..."`

