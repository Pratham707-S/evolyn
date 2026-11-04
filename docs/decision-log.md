# Evolyn Architectural Decision Records (ADR)

> **Team Matrix Mechanics** | Decision Log

---

## ADR 001: Monorepo Architecture with npm Workspaces
* **Date:** 2026-11-04
* **Decision:** Use an npm Workspaces monorepo (`apps/web`, `apps/api`, `packages/shared`).
* **Context:** The team consists of 4 developers working simultaneously across frontend, backend, database, and knowledge retrieval.
* **Why Appropriate:** Eliminates multi-repo drift, simplifies local development with a single `npm install`, and guarantees 100% type safety across frontend and backend through `@evolyn/shared`.

---

## ADR 002: Modular Monolith vs Microservices
* **Date:** 2026-11-04
* **Decision:** Implement a modular monolith inside `apps/api` with strict internal boundaries.
* **Context:** Building for a hackathon competition (Round 2) requires high reliability, low operational overhead, and rapid feature iteration.
* **Why Appropriate:** Avoids distributed latency, network partition failures, and deployment complexity, while retaining clean domain isolation (`modules/guidelines`, `modules/submissions`, etc.) that can easily be split later if needed.

---

## ADR 003: PostgreSQL with pgvector & Drizzle ORM
* **Date:** 2026-11-04
* **Decision:** Use PostgreSQL with the `pgvector` extension and Drizzle ORM.
* **Context:** The platform requires relational integrity for brand rules, audit logs, and decisions, combined with high-performance vector search for semantic guideline retrieval.
* **Why Appropriate:** Combining relational and vector data in a single ACID-compliant database eliminates the need to run, sync, and manage a separate vector database (like Pinecone or Milvus). Drizzle provides zero-runtime-overhead TypeScript queries with native pgvector support.

---

## ADR 004: Environment-Driven Gemini Configuration
* **Date:** 2026-11-04
* **Decision:** Keep Gemini model identifiers (`GEMINI_MODEL`, `GEMINI_EMBEDDING_MODEL`) strictly environment-driven via Zod validation.
* **Context:** AI models evolve rapidly, and hardcoded model strings cause breakages when model versions are updated or deprecate.
* **Why Appropriate:** Allows seamless switching between `gemini-2.0-flash`, `gemini-1.5-pro`, or newer checkpoints via `.env` without modifying code.

---

## ADR 005: Mandatory Verbatim Source Quotation & Programmatic Grounding
* **Date:** 2026-11-04
* **Decision:** Every flagged violation must include a verbatim substring quote (`source_quote`) from the underlying guideline, verified programmatically before persistence.
* **Context:** LLMs can hallucinate rules or invent non-existent brand policies.
* **Why Appropriate:** Guarantees zero-hallucination compliance. A human judge can instantly verify that every flagged issue points to authentic, pre-approved text.
