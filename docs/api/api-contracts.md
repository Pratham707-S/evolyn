# REST API Contracts & Endpoint Specifications

> **Base URL:** `http://localhost:5001`
> **All contracts defined in:** `@evolyn/shared/contracts/api`

---

## 1. System Health
- `GET /health` | `GET /api/health`
  - Response: `{ status: "ok", service: "evolyn-api", database: "connected", gemini: { model, embeddingModel, configured } }`

## 2. Guidelines Module (`modules/guidelines`)
- `POST /api/guidelines` — Create guideline document
  - Body: `CreateGuidelineRequest`
  - Response: `CreateGuidelineResponse`
- `GET /api/guidelines` — List active guidelines
  - Response: `ListGuidelinesResponse`
- `GET /api/guidelines/:id` — Guideline details with rules & conflicts
  - Response: `GuidelineDetailResponse`

## 3. Knowledge Module (`modules/knowledge`)
- `POST /api/facts` — Store approved factual claim with verified citation
  - Body: `CreateApprovedFactRequest`
- `GET /api/facts` — List approved facts
  - Response: `ListApprovedFactsResponse`

## 4. Submissions Module (`modules/submissions`)
- `POST /api/submissions` — Ingest copy for brand review
  - Body: `CreateSubmissionRequest`
  - Response: `CreateSubmissionResponse`
- `GET /api/submissions` — List past submissions
  - Optional query filters: `status`, `channel`
  - Response: `ListSubmissionsResponse`
- `GET /api/submissions/:id` — Get a submission with its latest review run and decision
  - Response: `{ submission: ContentSubmission & { reviewRun: ReviewRun | null; decision: Decision | null } }`
  - Returns `404` when the submission does not exist

## 5. Reviews Module (`modules/reviews`)
- `POST /api/submissions/:id/analyze` — Trigger governance audit
  - Response: `AnalyzeSubmissionResponse`
- `GET /api/submissions/:id/review` — Review details with highlighted issues
  - Response: `ReviewDetailsResponse`
- `GET /api/review-runs/:reviewRunId/findings` — List verified findings for a review run
  - Response: `{ reviewRunId: string, findings: DetectedIssue[], total: number }`
  - Returns `404` when the review run does not exist
  - Returns `400` when `reviewRunId` is not a valid UUID

## 6. Decisions Module (`modules/decisions`)
- `POST /api/submissions/:id/decision` — Submit human review sign-off
  - Body: `SubmitDecisionRequest`
  - Response: `SubmitDecisionResponse`

## 7. Insights Module (`modules/insights`)
- `GET /api/insights/recurring-mistakes` — List aggregated mistakes
  - Response: `ListRecurringMistakesResponse`
