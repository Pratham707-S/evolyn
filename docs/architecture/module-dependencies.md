# Module Dependency Architecture

> **Team:** Matrix Mechanics | **Lead:** Pratham

---

## 1. Dependency Graph

```mermaid
graph TD
    Shared["@evolyn/shared\n(Schemas, Types, Contracts)"]

    subgraph InfrastructureLayer["Infrastructure Layer"]
        DB["infrastructure/database\n(Drizzle & pgvector)"]
        AI["infrastructure/ai\n(Gemini Adapter)"]
        Storage["infrastructure/storage\n(S3 / Local Mock)"]
        Log["infrastructure/logging\n(Structured Logger)"]
    end

    subgraph DomainModules["Domain Modules"]
        Guidelines["modules/guidelines\n(Mann)"]
        Knowledge["modules/knowledge\n(Mann)"]
        Submissions["modules/submissions\n(Ayan)"]
        Reviews["modules/reviews\n(Ayan & Pratham)"]
        Findings["modules/findings\n(Ayan & Pratham)"]
        Decisions["modules/decisions\n(Ayan)"]
        Insights["modules/insights\n(Pratham)"]
    end

    %% Dependencies
    DomainModules --> Shared
    Guidelines --> DB
    Guidelines --> AI
    Guidelines --> Storage
    Knowledge --> DB
    Knowledge --> AI
    Submissions --> DB
    Reviews --> DB
    Reviews --> AI
    Reviews --> Guidelines
    Reviews --> Knowledge
    Reviews --> Findings
    Findings --> DB
    Decisions --> DB
    Decisions --> Submissions
    Decisions --> Insights
    Insights --> DB
    Insights --> Guidelines
    Insights --> AI
```

---

## 2. Cross-Module Isolation Rules

1. **Strict Upward / Outward Boundary:**
   - Modules may depend on `infrastructure/` and `@evolyn/shared`.
   - Modules may call public service methods of other modules via their public interface (e.g. `IGuidelineService`).
   - Modules MUST NOT import private files, repositories, or internal schemas from another module.
2. **Zero Direct DB Modification:**
   - Each database table has an exclusive owner module.
   - Only `modules/submissions` writes to `content_submissions`.
   - Only `modules/guidelines` writes to `guidelines` and `guideline_rules`.
   - Only `modules/decisions` writes to `decisions`.
3. **No Express In Services:**
   - Domain services receive typed DTOs and return typed domain objects.
   - Express `Request` and `Response` objects never enter service functions.
