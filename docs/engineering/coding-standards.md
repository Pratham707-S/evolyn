# Engineering Coding Standards

> **Team Matrix Mechanics** | Engineering Handbook

---

## 1. Code Style & Hygiene
1. **Explicit Types:** Avoid `any`. Use inferred types from Zod (`z.infer<typeof schema>`).
2. **Short, Focused Files:** Keep files focused on a single concept, ideally under 250 lines.
3. **No Silent Failures:** Never catch an error without either logging it through `logger.error()` or rethrowing a descriptive domain error.
4. **Clean Layer Separation:**
   - Routes only route.
   - Controllers only orchestrate HTTP request/response.
   - Services only execute pure business rules.
   - Repositories only communicate with Drizzle ORM.

---

## 2. Zero-Hallucination Guardrails
1. Every flagged issue MUST have an authentic `source_quote`.
2. Services must verify `source_quote` exists in the brand guideline before persisting the finding.
3. AI only assists; human reviewers make all binding approval decisions.
