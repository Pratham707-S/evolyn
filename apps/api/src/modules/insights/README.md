# Continuous Insights & Improvement Loop Module (`modules/insights`)

> **Assigned Engineer:** Pratham (Project Lead & Architecture)
> **Reviewer:** Mann (Guideline Knowledge Lead)

---

## 1. Module Responsibility
- Recurring Mistake → Guideline Improvement Loop (Core Innovation 3).
- Aggregates repeated violations per rule from completed reviews and human rejections.
- Uses Gemini AI to synthesize real-world violation excerpts into clear, actionable guideline improvements.
- Provides a one-click refinement mechanism for Brand Guardians to update ambiguous rules.

---

## 2. Expected Inputs & Outputs
- **Inputs:**
  - Violated rule IDs and sample flagged excerpts.
  - Frequency counter thresholds (e.g., 3+ violations).
- **Outputs:**
  - Persisted `recurring_mistakes` records.
  - Gemini-generated guideline wording revision suggestions.

---

## 3. Dependencies
- `@evolyn/shared`: Recurring mistake schemas and types.
- `modules/guidelines`: Update refined guideline rules.
- `infrastructure/database`: Drizzle ORM instance (`recurring_mistakes` table).
- `infrastructure/ai`: Gemini AI refinement generation.

---

## 4. Public Interface Contract
Exported via `modules/insights/index.ts`:
- `InsightsService`:
  - `trackViolation(ruleId: string, sampleExcerpt: string): Promise<void>`
  - `listRecurringMistakes(): Promise<RecurringMistake[]>`
  - `generateRefinement(ruleId: string): Promise<string>`
  - `applyRefinement(ruleId: string, newStatement: string): Promise<void>`

---

## 5. Files Owned by this Module
- `apps/api/src/modules/insights/insights.routes.ts`
- `apps/api/src/modules/insights/insights.controller.ts`
- `apps/api/src/modules/insights/insights.service.ts`
- `apps/api/src/modules/insights/insights.repository.ts`
- `apps/api/src/modules/insights/insights.types.ts`
- `apps/api/src/modules/insights/index.ts`
- `apps/api/src/modules/insights/__tests__/*`

---

## 6. Files it Must NOT Modify
- `apps/api/src/modules/submissions/*`
- `apps/api/src/modules/reviews/*`
