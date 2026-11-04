# Debugging Guide & Troubleshooting

> **Team Matrix Mechanics**

---

## Common Issues & Solutions

### 1. Database Connection Failure
- **Symptom:** `GET /health` returns `{ "database": "disconnected" }` with HTTP 503.
- **Root Cause:** PostgreSQL container is stopped or credentials mismatch.
- **Fix:**
  ```bash
  docker compose ps
  docker compose up -d
  ```

### 2. pgvector Extension Not Found
- **Symptom:** `type "vector" does not exist` error during migration.
- **Fix:** Ensure `pgvector/pgvector:pg16` image is used (already defined in `docker-compose.yml`) and run:
  ```bash
  npm run db:migrate
  ```

### 3. TypeScript Monorepo Resolution Issues
- **Symptom:** Cannot find module `@evolyn/shared`.
- **Fix:** Rebuild the shared package:
  ```bash
  npm run --workspace=@evolyn/shared build
  ```
