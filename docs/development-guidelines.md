# Evolyn Development Guidelines

> **Team Matrix Mechanics** | Engineering Handbook

---

## 1. Clean Code Standards

1. **Self-Documenting Code:** Write clear variable and function names. Comments should explain *why* a design decision was made, not repeat what the code does.
2. **Small Functions & Files:**
   - Keep functions focused on a single responsibility (ideally under 40 lines).
   - Keep files focused on a single concept (ideally under 250 lines).
3. **No Magic Numbers or Strings:**
   - Use enums and constants from `@evolyn/shared`.
   - Never hardcode model strings or database URLs inside business logic.
4. **Strict Error Handling:**
   - Always throw typed, descriptive domain errors.
   - Catch errors at the controller boundary and return standard error JSON payloads.
   - Never suppress or swallow errors silently.

---

## 2. AI Integration & Grounding Rules (Zero Hallucination)

1. **Strict Output Schemas:** Every Gemini API call must use structured JSON output enforced by Zod.
2. **Mandatory Verbatim Grounding:**
   - The AI must return the verbatim substring (`source_quote`) from the guideline or approved fact.
   - The backend MUST verify programmatically that `source_quote` is an exact or near-exact substring of the loaded guideline/fact before persisting the issue.
   - If the quote does not match, the finding is discarded or flagged for verification.
3. **No Automatic Decisions:** AI only surfaces *detected issues* and *confidence scores*. Final approval or rejection is exclusively a human action.

---

## 3. Git Workflow, Branch Naming & Commit Hygiene

### Branch Naming Conventions
Always use the following format: `feat/<module-name>-<developer>` or `feat/<short-descriptor>`:
- `feat/guideline-knowledge-hub` — (Mann)
- `feat/backend-submissions` — (Ayan)
- `feat/backend-reviews` — (Ayan & Pratham)
- `feat/frontend-dashboard` — (Pratham Kave)
- `feat/frontend-guidelines` — (Pratham Kave)
- `feat/frontend-review-workbench` — (Pratham Kave)

### Commit Messages
Use Conventional Commits:
- `feat(guidelines): add rule extraction parser`
- `fix(reviews): handle missing proof source gracefully`
- `docs(architecture): update ER diagram with pgvector`

### Secrets Protection
- Never commit `.env`, API keys, database credentials, or secret tokens.
- Always check `git status` before committing.
