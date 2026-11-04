# Evolyn Docker & Container Infrastructure

This directory contains container configurations and documentation for Evolyn.

## Local Database Development

The platform requires PostgreSQL 16 with the `pgvector` extension.

The local development container is orchestrated via the root `docker-compose.yml`:

```bash
# Start PostgreSQL with pgvector in background
docker compose up -d

# Verify container is healthy
docker compose ps

# View PostgreSQL logs
docker compose logs -f postgres

# Stop the container
docker compose down
```

### Container Details
- **Image:** `pgvector/pgvector:pg16`
- **Port:** `5432:5432`
- **Default Database:** `evolyn_db`
- **Default User:** `evolyn`
- **Default Password:** `evolyn_secret`
- **Persistent Volume:** `evolyn_pgdata`
