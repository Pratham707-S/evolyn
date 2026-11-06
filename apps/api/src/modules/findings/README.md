# Findings & Evidence Verification Module (`modules/findings`)

> **Assigned Engineer:** Ayan (Backend) & Pratham (QA & Integration)
> **Reviewer:** Pratham Kave (UI Integration)

---

## 1. Module Responsibility
- Extraction and persistence of atomic issues found during governance reviews.
- **Zero-Hallucination Verbatim Quotation Guard:** Programmatically verifies that `source_quote` exists as an authentic substring of canonical stored guideline rules or approved facts resolved by ID. AI-provided `sourceText` is never trusted as evidence.
- **Claim Evidence Strength Engine (Core Innovation 2):** Quantifies evidence certainty (0.0 to 1.0) by cross-referencing claims with verified corporate fact citations.
- Character offset mapping (`charStart`, `charEnd`) for frontend highlight rendering.

---

## 2. Expected Inputs & Outputs
- **Inputs:**
  - Raw findings array from review execution, each carrying a valid `ruleId` or `factId` pointing to canonical stored ground truth.
  - Original submitted content for validating or deriving excerpt offsets.
- **Outputs:**
  - Persisted `detected_issues` records with validated quotes, confidence scores, and evidence strength scores.

---

## 3. Dependencies
- `@evolyn/shared`: `detectedIssueSchema` and domain types.
- `infrastructure/database`: Drizzle ORM instance (`detected_issues`, `guideline_rules`, `guidelines`, `approved_facts`, `review_runs`).

---

## 4. Public Interface Contract
Exported via `modules/findings/index.ts`:
- `FindingsService`:
  - `recordFindings(reviewRunId: string, rawFindings: RawFindingInput[], submissionText: string): Promise<DetectedIssue[]>`
  - `verifyVerbatimQuote(quote: string, sourceText: string): boolean`
  - `getFindingsByReviewRunId(reviewRunId: string): Promise<DetectedIssue[] | null>`

The read endpoint `GET /api/review-runs/:reviewRunId/findings` returns findings for a review run (HTTP 200) or HTTP 404 when the review run does not exist. Citation and excerpt validation happen before findings are persisted; invalid findings are rejected as a batch.

---

## 5. Files Owned by this Module
- `apps/api/src/modules/findings/findings.routes.ts`
- `apps/api/src/modules/findings/findings.controller.ts`
- `apps/api/src/modules/findings/findings.service.ts`
- `apps/api/src/modules/findings/findings.repository.ts`
- `apps/api/src/modules/findings/findings.types.ts`
- `apps/api/src/modules/findings/index.ts`
- `apps/api/src/modules/findings/__tests__/*`

---

## 6. Files it Must NOT Modify
- `apps/api/src/modules/submissions/*`
- `apps/api/src/modules/decisions/*`
