# Evolyn REST API Contracts & Specifications

> **Base URL:** `http://localhost:5001` (Development)
> **Protocol:** JSON over HTTP
> **Validation:** Zod Schemas via `@evolyn/shared`

---

## 1. System & Health

### `GET /health`
Returns system status, database connectivity, and Gemini AI configuration.

**Response `200 OK` (or `503 Service Unavailable` if database disconnected):**
```json
{
  "status": "ok",
  "service": "evolyn-api",
  "timestamp": "2026-11-04T11:20:00.000Z",
  "uptime": 142,
  "database": "connected",
  "gemini": {
    "model": "gemini-2.0-flash",
    "embeddingModel": "text-embedding-004",
    "configured": true
  }
}
```

---

## 2. Guideline Management (Mann & Ayan)

### `POST /api/guidelines`
Creates or uploads a brand guideline document.

**Request Body:**
```json
{
  "title": "Evolyn Brand Identity & Tone Guide",
  "category": "TONE",
  "version": "1.0",
  "rawContent": "1. Tone must be authoritative and empathetic...",
  "s3Url": null
}
```

**Response `201 Created`:**
```json
{
  "id": "7f8b3c21-...",
  "title": "Evolyn Brand Identity & Tone Guide",
  "category": "TONE",
  "version": "1.0",
  "status": "ACTIVE",
  "createdAt": "2026-11-04T11:20:00.000Z"
}
```

### `GET /api/guidelines`
Lists all active brand guidelines.

### `POST /api/guidelines/:id/extract-rules`
Extracts and persists atomic, verifiable brand rules strictly from the guideline's canonical stored content.
Caller-supplied request body overrides are disallowed.
Re-extraction replaces existing rules atomically inside a transaction to prevent duplicate accumulation.
Empty extraction results are rejected to protect existing rules.

**Response `200 OK`:**
```json
{
  "guidelineId": "7f8b3c21-...",
  "rules": [
    {
      "id": "11ab22cd-...",
      "guidelineId": "7f8b3c21-...",
      "ruleType": "MANDATORY",
      "ruleStatement": "Always write brand name as Evolyn.",
      "explanation": "Maintains brand consistency.",
      "severity": "CRITICAL",
      "createdAt": "2026-11-04T11:20:00.000Z"
    }
  ],
  "total": 1
}
```

**Response `404 Not Found`:**
```json
{
  "error": "Guideline not found"
}
```

**Response `400 Bad Request`:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "id",
      "message": "Invalid uuid"
    }
  ]
}
```

---

## 3. Approved Knowledge & Facts (Mann)

### `POST /api/facts`
Stores an approved brand metric or truth statement.

**Request Body:**
```json
{
  "topic": "Platform Uptime",
  "claimStatement": "Evolyn achieved 99.98% platform uptime throughout calendar year 2025.",
  "approvedProofSource": "SOC 2 Type II Independent Audit Report 2025, Section 4.2",
  "validUntil": "2027-12-31T23:59:59.000Z"
}
```

**Response `201 Created`**

---

## 4. Content Submissions (Ayan)

### `POST /api/submissions`
Submits marketing or communication copy for brand governance review.

**Request Body:**
```json
{
  "title": "Launch Copy - Social Post",
  "channel": "SOCIAL",
  "rawText": "Experience the revolutionary Evolyn platform! Guaranteed risk-free compliance with 100% uptime.",
  "submittedBy": "Marketing Campaign Team"
}
```

**Response `201 Created`:**
```json
{
  "submission": {
    "id": "e4a2b910-...",
    "title": "Launch Copy - Social Post",
    "channel": "SOCIAL",
    "status": "PENDING",
    "createdAt": "2026-11-04T11:25:00.000Z"
  }
}
```

`GET /api/submissions` lists submissions and accepts optional `status` and `channel` filters.
`GET /api/submissions/:id` returns the submission with its latest review run and decision, or `404` when it does not exist.

---

## 5. Reviews & Findings (Pratham & Ayan)

### `POST /api/submissions/:id/analyze`
Triggers the multi-layer semantic audit against brand rules and approved facts.

**Response `200 OK`:**
```json
{
  "reviewRunId": "9b12c34a-...",
  "submissionId": "e4a2b910-...",
  "overallComplianceScore": 45.0,
  "totalIssuesCount": 3,
  "summary": {
    "passedChecksCount": 1,
    "failedChecksCount": 3
  },
  "issues": [
    {
      "id": "11ab22cd-...",
      "issueType": "PROHIBITED_PHRASE",
      "flaggedExcerpt": "Guaranteed risk-free compliance",
      "explanation": "Regulatory compliance forbids absolute risk-free guarantees in enterprise software.",
      "suggestedFix": "Verified enterprise compliance guardrails",
      "sourceQuote": "Never use the phrase 'guaranteed risk-free' or '100% fail-proof' in any marketing or external copy.",
      "confidenceScore": 0.98,
      "evidenceStrengthScore": 0.05,
      "status": "OPEN"
    }
  ]
}
```

### `GET /api/review-runs/:reviewRunId/findings`
Returns the verified findings stored for a review run.

**Response `200 OK`:**
```json
{
  "reviewRunId": "9b12c34a-...",
  "findings": [],
  "total": 0
}
```

**Response `404 Not Found`:**
```json
{
  "error": "Review run not found"
}
```

**Response `400 Bad Request`:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "reviewRunId",
      "message": "Invalid uuid"
    }
  ]
}
```

---

## 6. Human Review Decisions (Ayan & Pratham Kave)

### `POST /api/submissions/:id/decision`
Records the final human approval or rejection decision.

**Request Body:**
```json
{
  "decision": "REJECTED",
  "reviewerName": "Judge Pratham",
  "comments": "Contains prohibited risk-free claims and unverified 100% uptime metric. Must be corrected before publishing.",
  "overriddenIssueIds": []
}
```

**Response `200 OK`:**
```json
{
  "id": "55ef66ab-...",
  "submissionId": "e4a2b910-...",
  "decision": "REJECTED",
  "reviewerName": "Judge Pratham",
  "status": "COMPLETED",
  "createdAt": "2026-11-04T11:30:00.000Z"
}
```
