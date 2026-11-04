# Team Contribution Guide

> **Team Matrix Mechanics**

---

## Getting Started

1. Clone repository and install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Start database container:
   ```bash
   docker compose up -d
   npm run db:migrate
   npm run db:seed
   ```
4. Checkout your assigned feature branch:
   - Mann: `git checkout -b feat/guideline-knowledge-hub`
   - Ayan: `git checkout -b feat/backend-submissions`
   - Pratham Kave: `git checkout -b feat/frontend-dashboard`

5. Verify locally before raising a PR:
   ```bash
   ./scripts/verify.sh
   ```
