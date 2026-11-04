# Evolyn Database Schema & Entity Relationships

> **Database Engine:** PostgreSQL 16 with `pgvector` Extension
> **ORM & Migration Tool:** Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
> **Vector Dimensions:** 768 (`text-embedding-004`)

---

## 1. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    GUIDELINES ||--o{ GUIDELINE_RULES : "contains"
    GUIDELINE_RULES ||--o{ GUIDELINE_CONFLICTS : "rule_a"
    GUIDELINE_RULES ||--o{ GUIDELINE_CONFLICTS : "rule_b"
    GUIDELINE_RULES ||--o{ DETECTED_ISSUES : "flagged_by"
    GUIDELINE_RULES ||--o| RECURRING_MISTAKES : "tracked_in"

    APPROVED_FACTS ||--o{ DETECTED_ISSUES : "grounded_by"

    CONTENT_SUBMISSIONS ||--o{ REVIEW_RUNS : "evaluated_in"
    CONTENT_SUBMISSIONS ||--o| DECISIONS : "concluded_by"

    REVIEW_RUNS ||--o{ DETECTED_ISSUES : "identifies"

    GUIDELINES {
        uuid id PK
        varchar(255) title
        varchar(50) category
        varchar(20) version
        text raw_content
        text s3_url
        varchar(20) status "ACTIVE | ARCHIVED | DRAFT"
        timestamptz created_at
        timestamptz updated_at
    }

    GUIDELINE_RULES {
        uuid id PK
        uuid guideline_id FK
        varchar(50) rule_type "MANDATORY | PROHIBITED | CONDITIONAL | RECOMMENDED"
        text rule_statement
        text explanation
        varchar(20) severity "CRITICAL | WARNING | SUGGESTION"
        vector(768) embedding
        jsonb metadata
        timestamptz created_at
    }

    GUIDELINE_CONFLICTS {
        uuid id PK
        uuid rule_a_id FK
        uuid rule_b_id FK
        varchar(50) conflict_type "CONTRADICTION | AMBIGUITY | OVERLAP"
        text explanation
        varchar(20) severity "HIGH | MEDIUM | LOW"
        varchar(20) status "OPEN | RESOLVED | ACKNOWLEDGED"
        timestamptz created_at
    }

    APPROVED_FACTS {
        uuid id PK
        varchar(100) topic
        text claim_statement
        text approved_proof_source
        timestamptz valid_until
        vector(768) embedding
        timestamptz created_at
    }

    CONTENT_SUBMISSIONS {
        uuid id PK
        varchar(255) title
        varchar(50) channel "SOCIAL | PRESS_RELEASE | BLOG | AD_COPY | WEBSITE | EMAIL"
        text raw_text
        text file_url
        varchar(100) submitted_by
        varchar(30) status "PENDING | ANALYZING | REVIEWED | APPROVED | REJECTED"
        timestamptz created_at
        timestamptz updated_at
    }

    REVIEW_RUNS {
        uuid id PK
        uuid submission_id FK
        real overall_compliance_score
        integer total_issues_count
        varchar(100) model_used
        jsonb summary
        timestamptz created_at
    }

    DETECTED_ISSUES {
        uuid id PK
        uuid review_run_id FK
        uuid rule_id FK "nullable"
        uuid fact_id FK "nullable"
        varchar(50) issue_type
        text flagged_excerpt
        integer char_start
        integer char_end
        text explanation
        text suggested_fix
        text source_quote "Verbatim quote from guideline or fact"
        real confidence_score
        real evidence_strength_score "Innovation 2"
        varchar(20) status "OPEN | ACCEPTED | OVERRIDDEN"
        timestamptz created_at
    }

    DECISIONS {
        uuid id PK
        uuid submission_id FK
        varchar(30) decision "APPROVED | REJECTED | CHANGES_REQUESTED"
        varchar(100) reviewer_name
        text comments
        jsonb overridden_issue_ids
        timestamptz created_at
    }

    RECURRING_MISTAKES {
        uuid id PK
        uuid rule_id FK "UNIQUE"
        integer violation_count
        jsonb sample_excerpts
        text suggested_guideline_revision
        varchar(30) status "PENDING_REVIEW | APPLIED | DISMISSED"
        timestamptz created_at
        timestamptz updated_at
    }
```

---

## 2. Table Specifications, Constraints & Indexes

### 1. `guidelines`
* **Primary Key:** `id` (UUID, `gen_random_uuid()`)
* **Foreign Keys:** None
* **Indexes:**
  - `idx_guidelines_status` ON (`status`)
  - `idx_guidelines_category` ON (`category`)
* **Business Invariant:** A guideline must have raw text content before rules can be extracted.

### 2. `guideline_rules`
* **Primary Key:** `id` (UUID)
* **Foreign Keys:** `guideline_id` REFERENCES `guidelines(id)` ON DELETE CASCADE
* **Vector Index:** `embedding vector(768)`
* **Indexes:**
  - `idx_rules_guideline_id` ON (`guideline_id`)
  - `idx_rules_rule_type` ON (`rule_type`)
  - `idx_rules_severity` ON (`severity`)
* **Business Invariant:** Deleting a guideline automatically purges all child rules and their associated conflict entries.

### 3. `guideline_conflicts`
* **Primary Key:** `id` (UUID)
* **Foreign Keys:**
  - `rule_a_id` REFERENCES `guideline_rules(id)` ON DELETE CASCADE
  - `rule_b_id` REFERENCES `guideline_rules(id)` ON DELETE CASCADE
* **Indexes:**
  - `idx_conflicts_rule_a` ON (`rule_a_id`)
  - `idx_conflicts_rule_b` ON (`rule_b_id`)
  - `idx_conflicts_status` ON (`status`)

### 4. `approved_facts`
* **Primary Key:** `id` (UUID)
* **Vector Index:** `embedding vector(768)`
* **Indexes:**
  - `idx_facts_topic` ON (`topic`)
* **Business Invariant:** Every fact requires an explicit, audited `approved_proof_source`.

### 5. `content_submissions`
* **Primary Key:** `id` (UUID)
* **Indexes:**
  - `idx_submissions_status` ON (`status`)
  - `idx_submissions_created_at` ON (`created_at`)

### 6. `review_runs`
* **Primary Key:** `id` (UUID)
* **Foreign Keys:** `submission_id` REFERENCES `content_submissions(id)` ON DELETE CASCADE
* **Indexes:**
  - `idx_review_runs_submission_id` ON (`submission_id`)

### 7. `detected_issues`
* **Primary Key:** `id` (UUID)
* **Foreign Keys:**
  - `review_run_id` REFERENCES `review_runs(id)` ON DELETE CASCADE
  - `rule_id` REFERENCES `guideline_rules(id)` ON DELETE SET NULL
  - `fact_id` REFERENCES `approved_facts(id)` ON DELETE SET NULL
* **Indexes:**
  - `idx_detected_issues_review_run` ON (`review_run_id`)
  - `idx_detected_issues_rule_id` ON (`rule_id`)
  - `idx_detected_issues_status` ON (`status`)
* **Integrity Guard:** `source_quote` cannot be empty. Fabricated or empty citations are rejected at insertion time.

### 8. `decisions`
* **Primary Key:** `id` (UUID)
* **Foreign Keys:** `submission_id` REFERENCES `content_submissions(id)` ON DELETE CASCADE
* **Indexes:**
  - `idx_decisions_submission_id` ON (`submission_id`)
* **Invariant:** A decision records human reviewer sign-off with comments.

### 9. `recurring_mistakes`
* **Primary Key:** `id` (UUID)
* **Foreign Keys:** `rule_id` REFERENCES `guideline_rules(id)` ON DELETE CASCADE
* **Unique Constraint:** `rule_id` (one record per rule, tracking cumulative violations)
* **Indexes:**
  - `idx_recurring_mistakes_rule_id` (UNIQUE)
  - `idx_recurring_mistakes_count` ON (`violation_count`)
