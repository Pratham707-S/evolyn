import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import { env } from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

if (env.NODE_ENV !== 'test' && (!env.DIRECT_URL || !env.DIRECT_URL.trim())) {
  throw new Error(
    'DIRECT_URL is strictly required for advisory-lock coordination. Silent fallback to PgBouncer transaction-pooling endpoint is forbidden.'
  );
}

// Dedicated unpooled pool strictly for session-level PostgreSQL advisory locks.
// Unsafe fallback to DATABASE_URL is strictly forbidden.
export const directPool = new Pool({
  connectionString: env.DIRECT_URL || (env.NODE_ENV === 'test' ? 'postgresql://mock:mock@localhost:5432/mock' : undefined),
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });
export const directDb = drizzle(directPool, { schema });

// Helper to check DB connectivity
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    return false;
  }
}
