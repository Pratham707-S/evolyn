import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, pool } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('🔄 Connecting to PostgreSQL and enabling pgvector extension...');
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✅ pgvector extension enabled');
  } finally {
    client.release();
  }

  console.log('🔄 Running Drizzle migrations...');
  const migrationsFolder = path.resolve(__dirname, './migrations');
  await migrate(db, { migrationsFolder });
  console.log('✅ Migrations completed successfully');

  await pool.end();
}

runMigrations().catch(async (err) => {
  console.error('❌ Migration failed:', err);
  await pool.end();
  process.exit(1);
});
