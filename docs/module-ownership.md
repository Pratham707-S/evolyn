# Evolyn Module Ownership & Team Responsibilities

> **Team:** Matrix Mechanics
> **Event:** CodeNexus India 2026 (Round 2)

---

## 1. Ownership Matrix

| Module | Primary Owner | Secondary / Reviewer | Scope of Work |
| :--- | :--- | :--- | :--- |
| **System Architecture & QA** | **Pratham** | Team | System design, cross-module contracts, CI/CD, final code review & quality gates |
| **Shared Contracts (`packages/shared`)** | **Pratham** | Ayan / Mann / Pratham Kave | Zod schemas, TypeScript types, validation rules, domain constants |
| **Guidelines (`modules/guidelines`)** | **Mann** | Pratham | Guideline upload, parsing, atomic rule extraction, Conflict Detector (Innovation 1) |
| **Knowledge Base (`modules/knowledge`)** | **Mann** | Ayan | Approved facts, terminology dictionary, vector embeddings, source references |
| **Submissions (`modules/submissions`)** | **Ayan** | Pratham | Content submission ingestion, channels, metadata, file attachments |
| **Reviews & Governance (`modules/reviews`)** | **Ayan / Pratham** | Mann | Evaluation pipeline orchestration, deterministic checks, Gemini RAG, Evidence Scorer (Innovation 2) |
| **Findings (`modules/findings`)** | **Pratham / Ayan** | Pratham Kave | Issue extraction, source quote verification, confidence score calculation |
| **Decisions (`modules/decisions`)** | **Ayan** | Pratham Kave | Human decision recording (Approve/Reject/Changes), audit trail persistence |
| **Continuous Insights (`modules/insights`)** | **Pratham** | Mann | Recurring Mistake Loop (Innovation 3), violation frequency analysis, guideline refinement |
| **Frontend UI/UX (`apps/web`)** | **Pratham Kave** | Pratham | Next.js App Router, Tailwind design system, 5-step judge workflow interface |

---

## 2. Cross-Module Communication Rules

1. **No Direct Database Access:** A module cannot query another module's database tables directly unless it is part of an approved read-only aggregation.
2. **Public Service Interfaces:** If `reviews` needs candidate facts from `knowledge`, it invokes `knowledgeService.findSimilarFacts(vector, threshold)`. It does NOT import `knowledgeRepository`.
3. **Shared Contract Changes:** Any modification to `packages/shared` requires review and sign-off by **Pratham** before merging.
4. **Git Feature Branches:** All development must occur on descriptive feature branches (e.g., `feat/guidelines-ingestion-mann`, `feat/submissions-api-ayan`, `feat/review-ui-pratham-kave`). Never push directly to `main`.
