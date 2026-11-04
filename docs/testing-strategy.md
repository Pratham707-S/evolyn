# Evolyn Testing Strategy & Quality Assurance

> **Lead:** Pratham | **Team:** Matrix Mechanics

---

## 1. Testing Pyramid

```
       /\
      /  \     End-to-End Tests (Judge 5-step workflow)
     /----\
    /      \    Integration Tests (Drizzle DB + pgvector + API endpoints)
   /--------\
  /          \  Unit Tests (Zod validation, citation verification, rule logic)
 /------------\
```

---

## 2. Test Suites by Module

1. **Shared (`packages/shared`):**
   - Unit tests validating Zod schemas: valid payloads, missing required fields, boundary values, invalid UUIDs, unexpected channel enums.
2. **Guideline Knowledge (`apps/api` - Mann):**
   - Unit tests for rule parsing logic.
   - Integration tests: persisting guidelines, generating vector embeddings, querying similar rules.
3. **Submissions & Reviews (`apps/api` - Ayan & Pratham):**
   - Unit tests: verbatim quote verification engine, evidence score calculation.
   - Integration tests: `POST /api/submissions`, `POST /api/submissions/:id/analyze`.
4. **Decisions & Audit (`apps/api` - Ayan):**
   - Unit tests: decision recording, override tracking.
   - Integration tests: `POST /api/submissions/:id/decision`.
5. **Frontend UI (`apps/web` - Pratham Kave):**
   - Component rendering tests: issue cards, split-screen highlight rendering, decision modal.

---

## 3. Verification Quality Gates Before Every PR

Before merging any feature branch, all 4 gates must pass:
1. `npm run typecheck` — 0 TypeScript errors across all workspaces.
2. `npm run build` — Successful clean build of `@evolyn/shared`, `@evolyn/api`, and `@evolyn/web`.
3. Unit & Integration test suite passes.
4. Security check — zero unignored `.env` or credential files tracked in Git.
