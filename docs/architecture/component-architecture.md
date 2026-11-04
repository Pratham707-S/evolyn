# Component Architecture

> **Platform:** Evolyn Brand Governance Platform
> **Architecture:** Modular Monolith with Next.js & Express

---

## 1. System Overview

```mermaid
graph TB
    subgraph FrontendApp["apps/web (Next.js 14 App Router)"]
        Nav["components/layout/Navbar"]
        Stepper["features/dashboard (5-Step Stepper)"]
        GuideUI["features/guidelines (Upload & Rules)"]
        SubmitUI["features/submissions (Studio)"]
        ReviewUI["features/reviews (Split Screen)"]
        DecisionUI["features/decisions (Sign-off)"]
        ApiClient["lib/api (Typed Client)"]
    end

    subgraph BackendApp["apps/api (Express Modular Monolith)"]
        Server["server.ts (HTTP Listener)"]
        App["app.ts (Middlewares & Mounts)"]

        subgraph Modules["Domain Modules"]
            M_Guide["modules/guidelines"]
            M_Know["modules/knowledge"]
            M_Sub["modules/submissions"]
            M_Rev["modules/reviews"]
            M_Find["modules/findings"]
            M_Dec["modules/decisions"]
            M_Ins["modules/insights"]
        end

        subgraph Infra["Infrastructure"]
            I_DB["infrastructure/database"]
            I_AI["infrastructure/ai"]
            I_Storage["infrastructure/storage"]
            I_Log["infrastructure/logging"]
        end
    end

    subgraph DataTier["Data Tier"]
        Postgres[("PostgreSQL 16")]
        PgVector[("pgvector Embeddings (768-dim)")]
    end

    FrontendApp -->|JSON / REST| App
    App --> Modules
    Modules --> Infra
    I_DB --> Postgres
    I_DB --> PgVector
```

---

## 2. Shared Contracts Layer (`@evolyn/shared`)
Both `apps/web` and `apps/api` import validation schemas and interfaces directly from `@evolyn/shared`. This guarantees:
- Frontend forms validate using the exact same Zod schemas as backend controllers.
- Backend API responses match the frontend's expected TypeScript types.
- Zero manual interface duplication across team boundaries.
