# Evolyn Architecture & System Blueprint

> **Team:** Matrix Mechanics
> **Platform:** Evolyn AI-Powered Brand Governance Platform
> **Event:** CodeNexus India 2026 (Round 2)
> **Status:** Phase 1 Foundation Active

---

## 1. System Philosophy & Objectives

Evolyn is designed as a **Modular Monolith** rather than a distributed set of microservices.

### Why Modular Monolith?
1. **Operational Simplicity:** Avoids network latency, service discovery overhead, distributed transaction complexity, and multi-repo synchronization friction during a hackathon build window.
2. **Clear Boundaries without Distributed Complexity:** Each domain module (`guidelines`, `knowledge`, `submissions`, `reviews`, `findings`, `decisions`, `insights`) maintains strict encapsulation:
   - Routes handle HTTP mapping and validation.
   - Controllers orchestrate operations.
   - Services execute domain business logic (independent of Express objects).
   - Repositories encapsulate Drizzle ORM queries and database interactions.
3. **Shared Contracts:** `@evolyn/shared` provides a single source of truth for TypeScript interfaces and Zod validation schemas, eliminating schema drift between backend and frontend.

---

## 2. High-Level System Context (C4 Level 1)

```mermaid
graph TD
    User["Content Creator / Marketer"]
    Judge["Reviewer / Judge / Brand Guardian"]

    subgraph EvolynSystem["Evolyn Brand Governance Platform"]
        Web["apps/web (Next.js 14 App Router)"]
        API["apps/api (Express.js Modular Monolith)"]
        DB[("PostgreSQL 16 + pgvector")]
    end

    Gemini["Google Gemini AI API\n(Flash 2.0 & text-embedding-004)"]
    S3["AWS S3 / S3-Compatible Storage"]

    User -->|Submits content for review| Web
    Judge -->|Manages guidelines, reviews findings, makes decisions| Web
    Web -->|REST API Calls (Zod validated)| API
    API -->|Persists rules, vectors, submissions, decisions| DB
    API -->|Vector embeddings & structured audits| Gemini
    API -->|Uploads guideline PDFs & assets| S3
```

---

## 3. Application Component Architecture (C4 Level 2)

```mermaid
graph TB
    subgraph WebApp["apps/web (Next.js App Router)"]
        UI_Dash["Dashboard & Evaluation Stepper"]
        UI_Guide["Guideline Management Hub"]
        UI_Submit["Content Submission Studio"]
        UI_Review["Interactive Review & Citation Split Screen"]
        UI_Decision["Decision & Audit Workbench"]
        UI_Insights["Recurring Mistake Loop Hub"]
    end

    subgraph BackendApp["apps/api (Express.js Core)"]
        Router["Express Router & Zod Middleware"]

        subgraph DomainModules["Domain Modules"]
            Mod_Guidelines["modules/guidelines\n(Mann - Knowledge Lead)"]
            Mod_Knowledge["modules/knowledge\n(Mann - Facts & Terms)"]
            Mod_Submissions["modules/submissions\n(Ayan - Backend Lead)"]
            Mod_Reviews["modules/reviews\n(Ayan/Pratham - Orchestration)"]
            Mod_Findings["modules/findings\n(Pratham/Ayan - Citations)"]
            Mod_Decisions["modules/decisions\n(Ayan - Human Sign-off)"]
            Mod_Insights["modules/insights\n(Pratham - Improvement Loop)"]
        end

        subgraph Infra["Infrastructure Layer"]
            Infra_DB["infrastructure/database\n(Drizzle ORM & pgvector)"]
            Infra_AI["infrastructure/ai\n(Gemini Provider Adapter)"]
            Infra_Storage["infrastructure/storage\n(S3 Storage Adapter)"]
            Infra_Log["infrastructure/logging\n(Structured Logger)"]
        end
    end

    subgraph DataStore["Data Tier"]
        PG["PostgreSQL Database"]
        PGV["pgvector Vector Embeddings (768-dim)"]
    end

    WebApp --> Router
    Router --> DomainModules
    DomainModules --> Infra
    Infra_DB --> PG
    Infra_DB --> PGV
    Infra_AI --> Gemini
    Infra_Storage --> S3
```

---

## 4. Module Dependency Graph

```mermaid
graph LR
    subgraph Contracts
        Shared["@evolyn/shared (Types, Zod Schemas)"]
    end

    subgraph CoreModules
        Guidelines["modules/guidelines"]
        Knowledge["modules/knowledge"]
        Submissions["modules/submissions"]
        Reviews["modules/reviews"]
        Findings["modules/findings"]
        Decisions["modules/decisions"]
        Insights["modules/insights"]
    end

    subgraph Infrastructure
        Infra_DB["database"]
        Infra_AI["ai"]
        Infra_Storage["storage"]
    end

    Guidelines --> Shared
    Knowledge --> Shared
    Submissions --> Shared
    Reviews --> Shared
    Findings --> Shared
    Decisions --> Shared
    Insights --> Shared

    Guidelines --> Infra_DB
    Guidelines --> Infra_AI
    Knowledge --> Infra_DB
    Knowledge --> Infra_AI
    Submissions --> Infra_DB
    Reviews --> Guidelines
    Reviews --> Knowledge
    Reviews --> Infra_AI
    Reviews --> Infra_DB
    Findings --> Reviews
    Decisions --> Submissions
    Decisions --> Infra_DB
    Insights --> Findings
    Insights --> Guidelines
    Insights --> Infra_AI
```

### Module Boundary Enforcement Rules:
1. **No Circular Imports:** Dependency flows strictly from application routes down to domain services, repositories, and infrastructure.
2. **Repository Isolation:** Modules must not directly call another module's internal repository. Cross-module communication uses exported domain services or public interfaces.
3. **No Direct Express in Services:** Services take pure input data (DTOs) and return domain results or throw domain errors. HTTP codes are assigned in controllers/middleware.
4. **Validation at the Boundary:** Every incoming request is validated against Zod schemas in middleware before reaching any controller logic.
