# Testing Strategy & Quality Gates

> **Lead:** Pratham | **Team:** Matrix Mechanics

---

## 1. Quality Gates (Must Pass Before PR Merge)

```bash
# Gate 1: Unit & Integration Tests
npm test

# Gate 2: TypeScript Typechecking
npm run typecheck

# Gate 3: Production Builds
npm run build
```

---

## 2. Test Architecture
- **In-Memory Testing:** Tests use mock requests/responses or in-memory execution rather than binding external TCP network sockets, preventing sandbox port collisions.
- **Zod Schema Tests:** Located in `packages/shared/src/__tests__`.
- **API Tests:** Located alongside modules in `apps/api/src/__tests__`.
