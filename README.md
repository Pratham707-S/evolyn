# Evolyn — AI-Powered Brand Governance Platform

> **Round 2 · CodeNexus India 2026**
> **Team:** Matrix Mechanics
> **Repository:** Team-Ready Modular Monolith

---

## 1. Project Overview & Philosophy

Evolyn is an AI-powered Brand Governance platform engineered to enforce brand consistency, tone, and factual precision across all organizational copy.

### The 5-Step Core Judge Workflow
1. **Add / Upload Brand Guidelines:** Ingest rules, tone policies, and verified facts.
2. **Submit Content for Review:** Submit marketing copy, social posts, or press releases.
3. **Verify Against Rules & Approved Facts:** Audit content using semantic search and AI reasoning.
4. **Inspect Issues with Verbatim Citations:** Review flagged issues with exact source quotes and evidence strength scores (zero hallucinations).
5. **Make Human Approval / Rejection Decision:** Mandatory human sign-off with audit logging.

### Three Core Innovations
- **Guideline Conflict & Ambiguity Detector:** Identifies contradictory or ambiguous rules within guidelines.
- **Claim Evidence Strength Engine:** Quantifies evidence certainty (0–100%) against verified corporate facts.
- **Recurring Mistake → Guideline Improvement Loop:** Synthesizes repeated review violations into suggested guideline wording improvements.

---

## 2. Team Structure & Module Ownership

| Team Member | Role | Assigned Ownership | Primary Directory |
| :--- | :--- | :--- | :--- |
| **Pratham** | Project Lead & Architect | System architecture, `@evolyn/shared`, integration, infrastructure, final QA | `packages/shared`, `docs/`, `apps/api/src/modules/insights` |
| **Ayan** | Backend Lead | Submissions, review orchestration, findings verification, human decisions | `apps/api/src/modules/submissions`, `reviews`, `findings`, `decisions` |
| **Mann** | Guideline Knowledge Engineer | Guideline upload, PDF parsing, rule extraction, approved facts repository, retrieval | `apps/api/src/modules/guidelines`, `knowledge` |
| **Pratham Kave** | Frontend Lead | Next.js frontend, dashboard, guideline hub, submission studio, review split-screen | `apps/web/src/features/*`, `apps/web/src/app` |

---

## 3. Repository Architecture

```
evolyn/
├── .github/
│   └── pull_request_template.md        # Standard PR checklist and quality gates
├── apps/
│   ├── api/                            # Express.js Modular Monolith
│   │   └── src/
│   │       ├── config/                 # Environment validation via Zod
│   │       ├── db/                     # Drizzle ORM client, schema, migrations, seed
│   │       ├── infrastructure/         # Central DB, AI adapter, Storage, Logger
│   │       ├── middleware/             # Error handling, request validation
│   │       ├── modules/                # Domain Modules (Clean Boundaries)
│   │       │   ├── guidelines/         # [Mann] Guideline ingestion & rule extraction
│   │       │   ├── knowledge/          # [Mann] Approved facts & terminology
│   │       │   ├── submissions/        # [Ayan] Content submission lifecycle
│   │       │   ├── reviews/            # [Ayan & Pratham] Review orchestration
│   │       │   ├── findings/           # [Ayan & Pratham] Issue extraction & citations
│   │       │   ├── decisions/          # [Ayan] Human review approval workflow
│   │       │   └── insights/           # [Pratham] Recurring mistake improvement loop
│   │       └── routes/                 # Express route mounts and health checks
│   │
│   └── web/                            # Next.js 14 App Router
│       └── src/
│           ├── app/                    # Next.js App Router root layout & landing
│           └── features/               # [Pratham Kave] Modular UI Features
│               ├── dashboard/          # Platform overview & 5-step judge stepper
│               ├── guidelines/         # Guideline upload & conflict cards
│               ├── submissions/        # Content submission studio
│               ├── reviews/            # Side-by-side review & citation inspector
│               └── decisions/          # Human decision workbench & audit badge
│
├── packages/
│   └── shared/                         # Single Source of Truth
│       └── src/
│           ├── constants/              # Domain enums & severities
│           ├── schemas/                # Zod validation schemas
│           ├── types/                  # TypeScript types inferred from Zod
│           └── contracts/              # API Request/Response payload contracts
│
├── docs/                               # 9 Comprehensive System Architecture Documents
├── docker-compose.yml                  # PostgreSQL 16 with native pgvector extension
├── .env.example                        # Safe environment template (NO SECRETS)
├── package.json                        # npm Workspaces root
└── tsconfig.base.json                  # Shared TypeScript configuration
```

---

## 4. Git Branching & Workflow Rules

### Suggested Feature Branches
Team members must develop exclusively on designated feature branches:
- `feat/guideline-knowledge-hub` — Guideline upload, PDF parsing & approved facts (Mann)
- `feat/backend-submissions` — Submission API & data storage (Ayan)
- `feat/backend-reviews` — Review orchestration, citation check & evidence scoring (Ayan & Pratham)
- `feat/frontend-dashboard` — Dashboard, navigation & judge stepper (Pratham Kave)
- `feat/frontend-guidelines` — Guideline management & conflict viewer UI (Pratham Kave)
- `feat/frontend-review-workbench` — Split-screen review & decision workbench UI (Pratham Kave)

### PR Quality Gates (All 4 Must Pass)
```bash
# 1. Run all unit and integration test suites
npm test

# 2. Check TypeScript types across all workspaces
npm run typecheck

# 3. Verify clean production build
npm run build

# 4. Generate & verify database migrations (if schema changed)
npm run db:generate
```

---

## 5. Local Setup & Execution Guide

### Prerequisites
- **Node.js**: v18+ (tested on v25.4.0)
- **npm**: v10+ (tested on v11.7.0)
- **Docker**: For local PostgreSQL + pgvector

### Quick Start
```bash
# 1. Install all dependencies across all packages
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start PostgreSQL with pgvector
docker compose up -d

# 4. Run database migrations & seed baseline brand manual
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Start development servers
npm run dev
```

- **Backend API:** `http://localhost:5001` (Health check: `http://localhost:5001/health`)
- **Frontend App:** `http://localhost:3000`
