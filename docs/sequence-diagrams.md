# Evolyn System Sequence Diagrams

> **System:** Evolyn AI Brand Governance Platform
> **Team:** Matrix Mechanics

---

## 1. Guideline Ingestion & Rule Embedding Flow

```mermaid
sequenceDiagram
    autonumber
    actor Judge as Brand Guardian (Mann)
    participant Web as Web Frontend
    participant API as API Controller
    participant Service as Guideline Service
    participant Gemini as Gemini AI
    participant DB as PostgreSQL (pgvector)

    Judge->>Web: Submits brand guideline document
    Web->>API: POST /api/guidelines
    API->>Service: createGuideline(dto)
    Service->>DB: Insert guideline (status: ACTIVE)
    Service->>Gemini: Parse raw text into atomic rules
    Gemini-->>Service: Extracted rules array
    loop For each rule
        Service->>Gemini: Generate 768-dim embedding
        Gemini-->>Service: Vector embedding
        Service->>DB: Insert guideline_rule with vector
    end
    Service-->>API: Guideline and rules created
    API-->>Web: 201 Created
    Web-->>Judge: Displays structured rules
```

---

## 2. Content Submission & Multi-Layer Audit Flow

```mermaid
sequenceDiagram
    autonumber
    actor Creator as Content Author
    participant Web as Web Frontend
    participant API as API Controller
    participant ReviewEngine as Governance Review Engine
    participant DB as PostgreSQL (pgvector)
    participant Gemini as Gemini AI

    Creator->>Web: Submits content for review
    Web->>API: POST /api/submissions
    API->>DB: Insert content_submission (status: PENDING)
    API-->>Web: Submission acknowledged

    Creator->>Web: Clicks "Run Governance Audit"
    Web->>API: POST /api/submissions/:id/analyze
    API->>ReviewEngine: runAudit(submissionId)
    ReviewEngine->>DB: Fetch submission text
    ReviewEngine->>Gemini: Generate submission embeddings
    Gemini-->>ReviewEngine: Embeddings vector
    ReviewEngine->>DB: Vector search (Cosine similarity top-k rules & facts)
    DB-->>ReviewEngine: Relevant brand rules & approved facts
    ReviewEngine->>Gemini: Audit prompt (rules + facts + text)
    Gemini-->>ReviewEngine: Raw issues with source quotes
    ReviewEngine->>ReviewEngine: Verify source quotes programmatically against source text
    ReviewEngine->>DB: Insert ReviewRun & DetectedIssues
    ReviewEngine->>DB: Update submission status to REVIEWED
    ReviewEngine-->>API: Review results
    API-->>Web: Highlighted issues, severity, evidence strength
    Web-->>Creator: Side-by-side review workbench
```

---

## 3. Human Approval Decision & Audit Trail Flow

```mermaid
sequenceDiagram
    autonumber
    actor Judge as Judge / Reviewer
    participant Web as Web Frontend
    participant API as API Controller
    participant DecisionService as Decision Service
    participant InsightsService as Insights Service
    participant DB as PostgreSQL

    Judge->>Web: Reviews flagged violations
    Judge->>Web: Enters decision rationale ("APPROVED" / "REJECTED")
    Web->>API: POST /api/submissions/:id/decision
    API->>DecisionService: recordDecision(submissionId, dto)
    DecisionService->>DB: Insert decision record
    DecisionService->>DB: Update submission status (APPROVED / REJECTED)
    DecisionService->>InsightsService: recordViolationsForRuleImprovement(issueIds)
    InsightsService->>DB: Upsert recurring_mistakes table
    DecisionService-->>API: Decision recorded
    API-->>Web: Immutable audit confirmation
    Web-->>Judge: Displays decision certificate & audit history
```
