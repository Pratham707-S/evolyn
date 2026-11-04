# Governance Reviews & Orchestration Module (`modules/reviews`)

> **Assigned Engineer:** Ayan (Backend Lead) & Pratham (Integration & QA)
> **Reviewer:** Pratham Kave (Frontend Alignment)

---

## 1. Module Responsibility
- Central governance review orchestration pipeline:
  1. Retrieve submission text and generate query embeddings.
  2. Perform vector search in pgvector for candidate rules and candidate approved facts.
  3. Execute deterministic checks (exact banned phrases, case sensitivity, regex brand patterns).
  4. Invoke Gemini AI via `infrastructure/ai` with structured output prompts.
  5. Delegate issue persistence to `modules/findings`.
  6. Compute overall compliance score (0–100%) and persist `ReviewRun`.

---

## 2. Expected Inputs & Outputs
- **Inputs:**
  - `submissionId: string`
- **Outputs:**
  - `ReviewResult`: `{ reviewRunId: string, complianceScore: number, issuesCount: number, issues: DetectedIssue[] }`

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
