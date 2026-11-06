# Governance Reviews & Orchestration Module (`modules/reviews`)

> **Assigned Engineer:** Ayan (Backend Lead) & Pratham (Integration & QA)
> **Reviewer:** Pratham Kave (Frontend Alignment)

---

## 1. Module Responsibility
- Central governance review orchestration pipeline:
  1. Retrieve the submission through the submissions service and generate a query embedding.
  2. Retrieve similar rules and approved facts through injected public-service contracts.
  3. Check exact quoted prohibited phrases before invoking the AI audit.
  4. Invoke Gemini through `infrastructure/ai` with schema-validated JSON output.
  5. Discard AI findings whose excerpt or citation cannot be grounded, then persist verified findings through `modules/findings`.
  6. Compute the compliance score and persist a `ReviewRun`.

---

## 2. Expected Inputs & Outputs
- **Inputs:**
  - `submissionId: string`
- **Outputs:**
  - `ReviewExecutionResult`: `{ reviewRun: ReviewRun, issues: DetectedIssue[] }`

---

## 3. Dependencies
- `modules/submissions`: Retrieve content to review and update status.
- `modules/guidelines`: Query similar brand rules via vector search.
- `modules/knowledge`: Query similar approved facts.
- `modules/findings`: Verify citations and persist detected issues.
- `infrastructure/ai`: Gemini AI audit adapter.
- `infrastructure/database`: Drizzle ORM instance (`review_runs` table).

---

## 4. Public Interface Contract
Exported via `modules/reviews/index.ts`:
- `ReviewService`:
  - `executeReview(submissionId: string): Promise<ReviewExecutionResult>`
  - `getReviewBySubmissionId(submissionId: string): Promise<ReviewExecutionResult | null>`

The service receives submissions, similar-rule search, knowledge search, findings, and AI dependencies via its constructor. The HTTP router is created with `createReviewsRouter(reviewService, submissionService)` so the application can compose those dependencies without importing another module's repository. The router exposes `POST /submissions/:id/analyze` and `GET /submissions/:id/review` relative to its mount path.

The current guidelines service contract does not yet expose `findSimilarRules`; the application composition must provide that adapter, along with an implemented knowledge service, before mounting the review router.

---

## 5. Files Owned by this Module
- `apps/api/src/modules/reviews/reviews.routes.ts`
- `apps/api/src/modules/reviews/reviews.controller.ts`
- `apps/api/src/modules/reviews/reviews.service.ts`
- `apps/api/src/modules/reviews/reviews.repository.ts`
- `apps/api/src/modules/reviews/reviews.types.ts`
- `apps/api/src/modules/reviews/index.ts`
- `apps/api/src/modules/reviews/__tests__/*`

---

## 6. Files it Must NOT Modify
- `apps/api/src/modules/decisions/*`
- `apps/api/src/modules/guidelines/guidelines.repository.ts`
