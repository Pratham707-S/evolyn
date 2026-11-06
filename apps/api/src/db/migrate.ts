import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import * as schema from './schema.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getMigrationConnectionString(): { connectionString: string; isDirect: boolean } {
  if (env.DIRECT_URL) {
    return { connectionString: env.DIRECT_URL, isDirect: true };
  }
  return { connectionString: env.DATABASE_URL, isDirect: false };
}

export function createMigrationPool(connectionString: string): pg.Pool {
  return new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10000,
  });
}

export async function runMigrations() {
  const { connectionString, isDirect } = getMigrationConnectionString();
  console.log(`🔄 Initializing migration connection (${isDirect ? 'DIRECT_URL' : 'DATABASE_URL'})...`);

  const migrationPool = createMigrationPool(connectionString);
  const migrationDb = drizzle(migrationPool, { schema });

  try {
    console.log('🔄 Connecting to PostgreSQL and enabling pgvector extension...');
    const client = await migrationPool.connect();
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
      console.log('✅ pgvector extension enabled');
    } finally {
      client.release();
    }

    console.log('🔄 Running Drizzle migrations...');
    const migrationsFolder = path.resolve(__dirname, './migrations');
    await migrate(migrationDb, { migrationsFolder });
    console.log('✅ Migrations completed successfully');
  } finally {
    await migrationPool.end();
  }
}

// Auto-run if executed directly as script
if (process.argv[1] && (process.argv[1].endsWith('migrate.ts') || process.argv[1].endsWith('migrate.js'))) {
  runMigrations().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
}
