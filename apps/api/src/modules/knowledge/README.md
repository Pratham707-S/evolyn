# Knowledge & Approved Facts Module (`modules/knowledge`)

> **Assigned Engineer:** Mann (Guideline Knowledge Engineer)
> **Reviewer:** Ayan (Backend Lead) & Pratham (Architecture)

---

## 1. Module Responsibility
- Management of approved corporate facts, validated claims, and verified source citations.
- Semantic vector indexing of approved facts in PostgreSQL (`approved_facts` table).
- Nearest-neighbor similarity search to retrieve ground-truth facts for the Claim Evidence Strength Engine (Core Innovation 2).
- Brand terminology dictionary (approved terms, prohibited terms, and trademark casings).

---

## 2. Expected Inputs & Outputs
- **Inputs:**
  - `CreateApprovedFactDTO`: `{ topic: string, claimStatement: string, approvedProofSource: string, validUntil?: string }`
  - Query vector for semantic claim matching.
- **Outputs:**
  - Persisted `ApprovedFact` records with 768-dim embeddings.
  - Ranked array of corroborating facts with cosine distance scores.

---

## 3. Dependencies
- `@evolyn/shared`: Approved fact schemas, types, and constraints.
- `infrastructure/database`: Drizzle ORM instance (`approved_facts` table).
- `infrastructure/ai`: Gemini Embeddings API.

---

## 4. Public Interface Contract
Exported via `modules/knowledge/index.ts`:
- `KnowledgeService`:
  - `createFact(dto: CreateApprovedFactInput): Promise<ApprovedFact>`
  - `listFacts(topic?: string): Promise<ApprovedFact[]>`
  - `findRelevantFacts(queryVector: number[], limit?: number): Promise<Array<ApprovedFact & { similarity: number }>>`

---

## 5. Files Owned by this Module
- `apps/api/src/modules/knowledge/knowledge.routes.ts`
- `apps/api/src/modules/knowledge/knowledge.controller.ts`
- `apps/api/src/modules/knowledge/knowledge.service.ts`
- `apps/api/src/modules/knowledge/knowledge.repository.ts`
- `apps/api/src/modules/knowledge/knowledge.types.ts`
- `apps/api/src/modules/knowledge/index.ts`
- `apps/api/src/modules/knowledge/__tests__/*`

---

## 6. Files it Must NOT Modify
- `apps/api/src/modules/reviews/*`
- `apps/api/src/modules/submissions/*`
