# Guideline Management Module (`modules/guidelines`)

> **Assigned Engineer:** Mann (Guideline Knowledge Engineer)
> **Reviewer:** Pratham (Architecture & Integration)

---

## 1. Module Responsibility
- Ingestion of brand guidelines via raw text input or PDF upload.
- Automated extraction of atomic, verifiable brand rules (`MANDATORY`, `PROHIBITED`, `CONDITIONAL`, `RECOMMENDED`).
- Generation of 768-dimensional vector embeddings for each rule via Gemini API.
- Semantic persistence into PostgreSQL with `pgvector`.
- Cross-rule evaluation for contradictions and ambiguities (Core Innovation 1).

---

## 2. Expected Inputs & Outputs
- **Inputs:**
  - `CreateGuidelineDTO`: `{ title: string, category: GuidelineCategory, version?: string, rawContent: string, s3Url?: string }`
  - PDF document file buffer (multipart/form-data).
- **Outputs:**
  - Persisted `Guideline` record and array of `GuidelineRule` records with vector embeddings.
  - Detected rule conflicts array (`GuidelineConflict[]`).

---

## 3. Dependencies
- `@evolyn/shared`: Data schemas, validation rules, and domain constants.
- `infrastructure/database`: Drizzle ORM instance (`guidelines`, `guideline_rules`, `guideline_conflicts` tables).
- `infrastructure/ai`: Gemini Embeddings (`text-embedding-004`) and rule extraction adapter.
- `infrastructure/storage`: S3/Local storage adapter for uploaded PDF assets.

---

## 4. Public Interface Contract
Exported via `modules/guidelines/index.ts`:
- `GuidelineService`:
  - `createGuideline(dto: CreateGuidelineInput): Promise<Guideline>`
  - `getGuidelines(filter?: { status?: string; category?: string }): Promise<Guideline[]>`
  - `getGuidelineById(id: string): Promise<GuidelineWithRules | null>`
  - `findSimilarRules(queryVector: number[], limit?: number): Promise<GuidelineRule[]>`

---

## 5. Files Owned by this Module
- `apps/api/src/modules/guidelines/guidelines.routes.ts`
- `apps/api/src/modules/guidelines/guidelines.controller.ts`
- `apps/api/src/modules/guidelines/guidelines.service.ts`
- `apps/api/src/modules/guidelines/guidelines.repository.ts`
- `apps/api/src/modules/guidelines/guidelines.types.ts`
- `apps/api/src/modules/guidelines/index.ts`
- `apps/api/src/modules/guidelines/__tests__/*`

---

## 6. Files it Must NOT Modify
- `apps/api/src/modules/submissions/*`
- `apps/api/src/modules/decisions/*`
- `apps/api/src/db/schema.ts` (Requires Pratham's architecture approval).
