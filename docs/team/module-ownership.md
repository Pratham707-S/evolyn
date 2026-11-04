# Module Ownership Matrix

> **Team Matrix Mechanics** | CodeNexus India Round 2

---

## Team Ownership Table

| Member | Role | Owned Directories | Database Tables Owned |
| :--- | :--- | :--- | :--- |
| **Pratham** | Project Lead & Architect | `packages/shared`, `docs/`, `apps/api/src/infrastructure`, `apps/api/src/modules/insights` | `recurring_mistakes` |
| **Ayan** | Backend Lead | `apps/api/src/modules/submissions`, `reviews`, `findings`, `decisions` | `content_submissions`, `review_runs`, `detected_issues`, `decisions` |
| **Mann** | Guideline Knowledge Engineer | `apps/api/src/modules/guidelines`, `modules/knowledge` | `guidelines`, `guideline_rules`, `guideline_conflicts`, `approved_facts` |
| **Pratham Kave** | Frontend Lead | `apps/web/src/features/*`, `apps/web/src/components/*` | UI integration across all tables |

---

## Inter-Module Contract
- No member may alter another member's database table schema without Pratham's architecture review.
- Cross-module calls must use published service interfaces (e.g., `IGuidelineService`, `IKnowledgeService`).
