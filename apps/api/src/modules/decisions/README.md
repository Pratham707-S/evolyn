# Human Decisions & Audit Trail Module (`modules/decisions`)

> **Assigned Engineer:** Ayan (Backend Lead)
> **Reviewer:** Pratham Kave (UI Integration) & Pratham (QA)

---

## 1. Module Responsibility
- Final human review decision workflow (Step 5 of Core Judge Mission).
- Records mandatory human sign-off (`APPROVED`, `REJECTED`, or `CHANGES_REQUESTED`).
- Captures reviewer comments, feedback rationale, and issue overrides.
- Updates parent submission status to maintain audit consistency.
- Notifies `modules/insights` when rules are overridden or violated.

---

## 2. Expected Inputs & Outputs
- **Inputs:**
  - `SubmitDecisionInput`: `{ submissionId: string, decision: DecisionType, reviewerName: string, comments: string, overriddenIssueIds?: string[] }`
- **Outputs:**
  - Persisted immutable `Decision` record.
  - Updated `ContentSubmission` status.

---

## 3. Dependencies
- `@evolyn/shared`: `submitDecisionSchema` and `decisionTypeSchema`.
- `modules/submissions`: Update submission status.
- `infrastructure/database`: Drizzle ORM instance (`decisions` table).

---

## 4. Public Interface Contract
Exported via `modules/decisions/index.ts`:
- `DecisionService`:
  - `recordDecision(input: SubmitDecisionInput): Promise<Decision>`
  - `getDecisionBySubmissionId(submissionId: string): Promise<Decision | null>`

---

## 5. Files Owned by this Module
- `apps/api/src/modules/decisions/decisions.routes.ts`
- `apps/api/src/modules/decisions/decisions.controller.ts`
- `apps/api/src/modules/decisions/decisions.service.ts`
- `apps/api/src/modules/decisions/decisions.repository.ts`
- `apps/api/src/modules/decisions/decisions.types.ts`
- `apps/api/src/modules/decisions/index.ts`
- `apps/api/src/modules/decisions/__tests__/*`

---

## 6. Files it Must NOT Modify
- `apps/api/src/modules/guidelines/*`
- `apps/api/src/modules/knowledge/*`
