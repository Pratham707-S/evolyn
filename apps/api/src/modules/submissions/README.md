# Content Submissions Module (`modules/submissions`)

> **Assigned Engineer:** Ayan (Backend Lead)
> **Reviewer:** Pratham (Architecture & Integration)

---

## 1. Module Responsibility
- Content ingestion: Marketing copy, social posts, press releases, blog drafts, ad copy.
- Input validation (channel, text length, submitter handle) using `@evolyn/shared`.
- Submission lifecycle tracking (`PENDING` -> `ANALYZING` -> `REVIEWED` -> `APPROVED` / `REJECTED`).
- Query and listing filters for past reviews.

---

## 2. Expected Inputs & Outputs
- **Inputs:**
  - `CreateSubmissionDTO`: `{ title: string, channel: SubmissionChannel, rawText: string, submittedBy?: string }`
- **Outputs:**
  - Persisted `ContentSubmission` record with status `PENDING`.
  - Detail query with associated `ReviewRun` and final `Decision` if completed.

---

## 3. Dependencies
- `@evolyn/shared`: Submission Zod schemas, types, and channel enums.
- `infrastructure/database`: Drizzle ORM instance (`content_submissions` table).

---

## 4. Public Interface Contract
Exported via `modules/submissions/index.ts`:
- `SubmissionService`:
  - `createSubmission(dto: CreateSubmissionInput): Promise<ContentSubmission>`
  - `getSubmissionById(id: string): Promise<ContentSubmission | null>`
  - `listSubmissions(filter?: { status?: string; channel?: string }): Promise<ContentSubmission[]>`
  - `updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<void>`

---

## 5. Files Owned by this Module
- `apps/api/src/modules/submissions/submissions.routes.ts`
- `apps/api/src/modules/submissions/submissions.controller.ts`
- `apps/api/src/modules/submissions/submissions.service.ts`
- `apps/api/src/modules/submissions/submissions.repository.ts`
- `apps/api/src/modules/submissions/submissions.types.ts`
- `apps/api/src/modules/submissions/index.ts`
- `apps/api/src/modules/submissions/__tests__/*`

---

## 6. Files it Must NOT Modify
- `apps/api/src/modules/guidelines/*`
- `apps/api/src/modules/knowledge/*`
- `apps/api/src/modules/decisions/*`
