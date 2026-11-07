#!/usr/bin/env node
import { directDb, directPool } from '../db/index.js';
import { MaintenanceGate } from '../modules/maintenance/maintenance-gate.js';
import { EmbeddingMigrationManager } from '../modules/maintenance/migration-manager.js';

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const modelArg = args.find((a) => a.startsWith('--model=') || a.startsWith('--target-model='));
  const targetModel = modelArg ? modelArg.split('=')[1] : 'gemini-embedding-2';

  if (!process.env.DIRECT_URL || !process.env.DIRECT_URL.trim()) {
    console.error('FATAL: DIRECT_URL is strictly required for exclusive advisory-lock coordination.');
    console.error('Refusing to run migration: silent fallback to PgBouncer transaction-pooling DATABASE_URL is prohibited.');
    process.exit(1);
  }

  console.log(`Starting embedding migration script (dryRun: ${isDryRun}, targetModel: ${targetModel})...`);

  // Dedicated unpooled PG client for global advisory lock
  const client = await directPool.connect();
  try {
    console.log('Acquiring global exclusive maintenance advisory lock across all instances...');
    await MaintenanceGate.acquireGlobalExclusiveLock(client);
    console.log('Global exclusive maintenance advisory lock acquired.');

    const manager = new EmbeddingMigrationManager(directDb, undefined, directPool);
    const result = await manager.runMigration({ dryRun: isDryRun, exclusiveClient: client, targetModel });

    console.log('Result:', JSON.stringify(result, null, 2));
  } finally {
    console.log('Releasing global exclusive maintenance advisory lock...');
    try {
      await MaintenanceGate.releaseGlobalExclusiveLock(client);
    } catch {
      // Ignore release errors on disconnect
    }
    client.release();
    await directPool.end();
  }
}

main().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});

