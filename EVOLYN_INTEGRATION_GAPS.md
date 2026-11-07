# Evolyn — Architectural Integration Gaps & Remediation Report

**Document Version**: 1.0.0  
**Updated**: November 7, 2026  
**Status**: All 6 Critical Architectural Gaps Resolved  

---

## Identified Integration Gaps & Implemented Solutions

### Gap 1: Disconnected Submission Input Methods (Upload & URL Import)
* **Pre-Resolution State**:
  The modal had 3 tabs: Write/Paste merely logged a toast; Upload File used a browser regex that failed on complex PDFs and never persisted uploads; Import URL showed an "N/A" badge with a disabled input.
* **Architectural Gap**:
  No file storage provider existed in `apps/api/src/infrastructure/storage`; no `multer` middleware was mounted; no SSRF defense or text-scraping service was present.
* **Remediation**:
  1. Created `LocalStorageProvider` (`apps/api/src/infrastructure/storage/local.storage.ts`) storing files to `apps/api/uploads/` and exposed via Express static middleware.
  2. Integrated `pdf-parse` v2 (`PdfExtractorService`) to extract clean page text, page counts, and metadata.
  3. Created `UrlExtractorService` with strict DNS pre-lookup validation (blocking loopback `127.0.0.1`, `10.x`, `172.16-31.x`, `192.168.x`, AWS metadata `169.254.169.254`) and HTML content extraction.
  4. Mounted `POST /api/submissions/upload` and `POST /api/submissions/extract-url`.

---

### Gap 2: Artificial Submissions Table Pagination
* **Pre-Resolution State**:
  `submissions-table.tsx` rendered static buttons labeled `1`, `2`, `3`, `...`, `98` even when only 3 records existed in the database.
* **Architectural Gap**:
  Frontend lacked pagination arithmetic and backend query did not return total record slices.
* **Remediation**:
  1. Updated `SubmissionController.list` to accept `page` and `pageSize`, returning `{ submissions, total, page, pageSize, totalPages }`.
  2. Implemented dynamic page calculation: `totalPages = Math.max(1, Math.ceil(total / pageSize))`.
  3. Replaced static JSX buttons with dynamic array mapping `Array.from({ length: totalPages }, (_, i) => i + 1)`.

---

### Gap 3: Static, Non-Editable Review Workspace
* **Pre-Resolution State**:
  `review-editor.tsx` rendered text inside static HTML `<p>` tags with hardcoded template strings. Users could not edit, type, format, or select text independently of AI suggestions.
* **Architectural Gap**:
  Absence of a headless ProseMirror-based rich text editor.
* **Remediation**:
  1. Installed `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, and `@tiptap/extension-underline` in `@evolyn/web`.
  2. Implemented full interactive TipTap document canvas with keyboard navigation, bold, italic, underline, strike, headings (H1, H2), ordered/unordered lists, undo/redo, word/character counts, and clean copy capabilities.
  3. Wired document text to live submission `rawText` from `GET /api/submissions/:id/review`.

---

### Gap 4: Disconnected Gemini AI Tools
* **Pre-Resolution State**:
  The 9 AI tools in `review-sidebar-tools.tsx` (`Improve Writing`, `Fix Grammar`, `Make Shorter`, `Make Longer`, `Simplify`, `Change Tone`, `Humanize`, `Summarize`, `Translate`) merely popped a toast message.
* **Architectural Gap**:
  Frontend was not sending rewrite mutation payloads to `POST /api/submissions/:id/rewrite`.
* **Remediation**:
  1. Connected every tool click to `POST /api/submissions/:id/rewrite` passing `{ action, content, instruction }`.
  2. Implemented `RewriteComparisonModal` providing side-by-side diff comparison between original draft and Gemini proposal.
  3. Clicking "Accept & Update Editor" immediately injects rewritten text into the TipTap editor instance.

---

### Gap 5: Ephemeral Findings & Suggestion Status
* **Pre-Resolution State**:
  Clicking "Accept" or "Dismiss" on an issue only modified local React state. On page refresh, findings reverted to default.
* **Architectural Gap**:
  Backend lacked an endpoint to persist individual finding status transitions.
* **Remediation**:
  1. Added `updateStatus` method to `FindingsRepository` and `FindingsService`.
  2. Mounted `PATCH /api/review-runs/:reviewRunId/findings/:findingId` validating `status: 'OPEN' | 'ACCEPTED' | 'OVERRIDDEN'`.
  3. Connected `review-ai-panel.tsx` to mutate finding status in database and reflect strikethrough/accepted visual styling.

---

### Gap 6: Excessively Tall Approvals Page
* **Pre-Resolution State**:
  Approvals layout stacked a tall queue table above an even taller inspector and decision panel, requiring over 1,500px of scrolling to reach the sign-off button.
* **Architectural Gap**:
  Sub-optimal desktop viewport organization.
* **Remediation**:
  1. Re-architected `apps/web/src/app/approvals/page.tsx` into a 3-column responsive workstation:
     - **Left (3 cols)**: Fast intake queue & search filters.
     - **Center (6 cols)**: Selected submission diffs, policies, and before/after comparisons.
     - **Right (3 cols)**: Sticky decision panel with quick reviewer notes presets and instant Approve/Request Changes/Reject sign-off controls.

