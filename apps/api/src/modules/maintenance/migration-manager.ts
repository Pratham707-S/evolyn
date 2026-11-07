import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { sql, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { guidelineRules, approvedFacts } from '../../db/schema.js';
import { GeminiAIProvider } from '../../infrastructure/ai/gemini.provider.js';
import { env } from '../../config/env.js';
import { MaintenanceGate, type PoolClientLike, type PoolLike } from './maintenance-gate.js';

export const EXPECTED_GUIDELINE_RULE_IDS = [
  'be98afe3-eaaa-48a6-9d14-3a67c0be3b6e',
  'cc01c8a5-b209-4982-9ec7-d6f56cea615f',
  'cdbaee85-ca34-408f-94b7-e5dac9834c07',
  '718a4108-f3bc-41c7-8342-9e587baa6fc6',
] as const;

export const EXPECTED_APPROVED_FACT_IDS = [
  '0f4cb02b-8689-4431-84f3-65ce21e5aef4',
  '0f4a08e5-fcc0-4d42-ac54-831bc35252fd',
  'ae2b7e83-d90b-472e-bd3e-60c3e8888e6a',
] as const;

export const EXPECTED_VECTOR_DIMENSIONS = 768;

export interface SerializedRecordBackup {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

export interface MigrationBackupFile {
  version: '1.0';
  timestamp: string;
  sourceModel: string;
  targetModel: string;
  expectedDimensions: number;
  sha256Checksum: string;
  guidelineRules: SerializedRecordBackup[];
  approvedFacts: SerializedRecordBackup[];
}

export interface MigrationOptions {
  dryRun?: boolean;
  targetModel?: string;
  backupDir?: string;
  provider?: GeminiAIProvider;
  exclusiveClient?: PoolClientLike;
}

export interface MigrationResult {
  success: boolean;
  dryRun: boolean;
  backupPath: string;
  resolvedModel: string;
  reIndexedRulesCount: number;
  reIndexedFactsCount: number;
}

export interface RollbackOptions {
  backupPath: string;
  exclusiveClient?: PoolClientLike;
}

export interface RollbackResult {
  success: boolean;
  restoredRulesCount: number;
  restoredFactsCount: number;
}

export function writeDurableBackupFile(filePath: string, content: string): void {
  const fd = fs.openSync(filePath, 'w', 0o600);
  try {
    fs.writeSync(fd, content, 0, 'utf-8');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

export function computePayloadChecksum(
  rules: SerializedRecordBackup[],
  facts: SerializedRecordBackup[]
): string {
  const normalizedRules = [...rules]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((r) => ({ id: r.id, text: r.text, embedding: r.embedding, metadata: r.metadata }));
  const normalizedFacts = [...facts]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((f) => ({ id: f.id, text: f.text, embedding: f.embedding, metadata: f.metadata }));

  const serialized = JSON.stringify({ rules: normalizedRules, facts: normalizedFacts });
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

export function validateRecordIds(
  records: Array<{ id: string }>,
  expectedIds: readonly string[],
  entityName: string
): void {
  if (records.length !== expectedIds.length) {
    throw new Error(
      `Record count mismatch for ${entityName}: expected ${expectedIds.length}, received ${records.length}`
    );
  }
  const expectedSet = new Set(expectedIds);
  for (const r of records) {
    if (!expectedSet.has(r.id)) {
      throw new Error(`Unexpected ${entityName} record ID: ${r.id}. Aborting migration.`);
    }
  }
}

export function validateVectors(
  records: Array<{ id: string; embedding: number[] }>,
  entityName: string
): void {
  for (const r of records) {
    if (
      !Array.isArray(r.embedding) ||
      r.embedding.length !== EXPECTED_VECTOR_DIMENSIONS ||
      !r.embedding.every(Number.isFinite)
    ) {
      throw new Error(
        `Invalid vector in ${entityName} for record ${r.id}: must contain ${EXPECTED_VECTOR_DIMENSIONS} finite floats`
      );
    }
  }
}

export function validateBackupPayload(backup: MigrationBackupFile): void {
  if (backup.version !== '1.0') {
    throw new Error(`Unsupported backup format version: ${backup.version}`);
  }
  if (backup.expectedDimensions !== EXPECTED_VECTOR_DIMENSIONS) {
    throw new Error(`Mismatched backup dimensions: expected ${EXPECTED_VECTOR_DIMENSIONS}, got ${backup.expectedDimensions}`);
  }

  validateRecordIds(backup.guidelineRules, EXPECTED_GUIDELINE_RULE_IDS, 'backup guideline_rules');
  validateRecordIds(backup.approvedFacts, EXPECTED_APPROVED_FACT_IDS, 'backup approved_facts');

  validateVectors(backup.guidelineRules, 'backup guideline_rules');
  validateVectors(backup.approvedFacts, 'backup approved_facts');

  const computedChecksum = computePayloadChecksum(backup.guidelineRules, backup.approvedFacts);
  if (computedChecksum !== backup.sha256Checksum) {
    throw new Error(
      `Backup checksum verification failed! Expected ${backup.sha256Checksum}, calculated ${computedChecksum}`
    );
  }
}

export class EmbeddingMigrationManager {
  constructor(
    private readonly database: NodePgDatabase<any>,
    private readonly maintenanceGate: MaintenanceGate = new MaintenanceGate(),
    private readonly pool?: PoolLike
  ) {}

  public async runMigration(options: MigrationOptions = {}): Promise<MigrationResult> {
    let ownedClient: PoolClientLike | null = null;
    if (!options.exclusiveClient && this.pool) {
      ownedClient = await this.pool.connect();
      await MaintenanceGate.acquireGlobalExclusiveLock(ownedClient);
    }

    try {
      const dryRun = Boolean(options.dryRun);
      if (!dryRun && env.NODE_ENV !== 'test' && (!env.DIRECT_URL || !env.DIRECT_URL.trim())) {
        throw new Error(
          'Migration preflight failed: DIRECT_URL is strictly required for advisory-lock coordination. Silent fallback to transaction-pooling DATABASE_URL is prohibited.'
        );
      }
      const targetModel = options.targetModel || 'gemini-embedding-2';
      const provider =
        options.provider ||
        new GeminiAIProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL, targetModel);

      console.log(
        JSON.stringify({
          type: 'EMBEDDING_MIGRATION_INITIATED',
          dryRun,
          targetModel,
          expectedDimensions: EXPECTED_VECTOR_DIMENSIONS,
        })
      );

      // 1. Fetch existing production records and current vectors
    const existingRules = await this.database.execute(sql`
      SELECT id, rule_statement, metadata, embedding::text as vec_text 
      FROM guideline_rules;
    `);
    const existingFacts = await this.database.execute(sql`
      SELECT id, claim_statement, COALESCE(to_jsonb(approved_facts.*)->'metadata', '{}'::jsonb) as metadata, embedding::text as vec_text 
      FROM approved_facts;
    `);

    // 2. Validate exact expected record counts and exact expected UUIDs
    const rulesRows = existingRules.rows as Array<{
      id: string;
      rule_statement: string;
      metadata: Record<string, unknown> | null;
      vec_text: string | null;
    }>;
    const factsRows = existingFacts.rows as Array<{
      id: string;
      claim_statement: string;
      metadata: Record<string, unknown> | null;
      vec_text: string | null;
    }>;

    validateRecordIds(rulesRows, EXPECTED_GUIDELINE_RULE_IDS, 'production guideline_rules');
    validateRecordIds(factsRows, EXPECTED_APPROVED_FACT_IDS, 'production approved_facts');

    // 3. Parse existing vectors and validate 768-dim finite floats
    const backupRules: SerializedRecordBackup[] = [];
    for (const r of rulesRows) {
      if (!r.vec_text) {
        throw new Error(`Rule ${r.id} missing embedding vector before migration`);
      }
      const vec = JSON.parse(r.vec_text) as number[];
      backupRules.push({
        id: r.id,
        text: r.rule_statement,
        metadata: r.metadata || {},
        embedding: vec,
      });
    }

    const backupFacts: SerializedRecordBackup[] = [];
    for (const f of factsRows) {
      if (!f.vec_text) {
        throw new Error(`Fact ${f.id} missing embedding vector before migration`);
      }
      const vec = JSON.parse(f.vec_text) as number[];
      backupFacts.push({
        id: f.id,
        text: f.claim_statement,
        metadata: f.metadata || {},
        embedding: vec,
      });
    }

    validateVectors(backupRules, 'guideline_rules existing vectors');
    validateVectors(backupFacts, 'approved_facts existing vectors');

    // 4. Construct verified backup payload with SHA-256 checksum
    const checksum = computePayloadChecksum(backupRules, backupFacts);
    const backupPayload: MigrationBackupFile = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      sourceModel: 'text-embedding-004',
      targetModel,
      expectedDimensions: EXPECTED_VECTOR_DIMENSIONS,
      sha256Checksum: checksum,
      guidelineRules: backupRules,
      approvedFacts: backupFacts,
    };

    // 5. Write backup file to disk with explicit fsync and verify read-back integrity
    const baseDir = options.backupDir || path.resolve(process.cwd(), 'backups');
    fs.mkdirSync(baseDir, { recursive: true });
    const backupPath = path.join(
      baseDir,
      `embeddings-backup-${Date.now()}-${dryRun ? 'dryrun' : 'prod'}.json`
    );
    writeDurableBackupFile(backupPath, JSON.stringify(backupPayload, null, 2));

    const readBack = JSON.parse(fs.readFileSync(backupPath, 'utf-8')) as MigrationBackupFile;
    validateBackupPayload(readBack);
    console.log(
      JSON.stringify({
        type: 'EMBEDDING_MIGRATION_BACKUP_DURABLE_VERIFIED',
        backupPath,
        checksum,
      })
    );

    // 6. Pre-generate all new embeddings via target model and verify model for EACH call
    const preparedRules: Array<{ id: string; embedding: number[]; metadata: Record<string, unknown> }> =
      [];
    for (const r of backupRules) {
      const vec = await provider.generateEmbedding(r.text, {
        dimensions: EXPECTED_VECTOR_DIMENSIONS,
      });
      const modelUsed = provider.getResolvedEmbeddingModel();
      if (modelUsed !== targetModel) {
        throw new Error(
          `Silent fallback detected on rule ${r.id}: used '${modelUsed}', strictly expected '${targetModel}'`
        );
      }
      preparedRules.push({
        id: r.id,
        embedding: vec,
        metadata: {
          ...r.metadata,
          embeddingModel: targetModel,
          embeddingDimensions: EXPECTED_VECTOR_DIMENSIONS,
          embeddedAt: new Date().toISOString(),
        },
      });
    }

    const preparedFacts: Array<{ id: string; embedding: number[]; metadata: Record<string, unknown> }> =
      [];
    for (const f of backupFacts) {
      const vec = await provider.generateEmbedding(f.text, {
        dimensions: EXPECTED_VECTOR_DIMENSIONS,
      });
      const modelUsed = provider.getResolvedEmbeddingModel();
      if (modelUsed !== targetModel) {
        throw new Error(
          `Silent fallback detected on fact ${f.id}: used '${modelUsed}', strictly expected '${targetModel}'`
        );
      }
      preparedFacts.push({
        id: f.id,
        embedding: vec,
        metadata: {
          ...f.metadata,
          embeddingModel: targetModel,
          embeddingDimensions: EXPECTED_VECTOR_DIMENSIONS,
          embeddedAt: new Date().toISOString(),
        },
      });
    }

    validateVectors(preparedRules, 'prepared guideline_rules');
    validateVectors(preparedFacts, 'prepared approved_facts');

    // 7. If dry run, terminate safely before database transaction
    if (dryRun) {
      console.log(
        JSON.stringify({
          type: 'EMBEDDING_MIGRATION_DRY_RUN_COMPLETED',
          message:
            'All preflight checks, backup generation, and AI vector calculations passed. Zero database writes performed.',
          backupPath,
          resolvedModel: targetModel,
          reIndexedRulesCount: preparedRules.length,
          reIndexedFactsCount: preparedFacts.length,
        })
      );
      return {
        success: true,
        dryRun: true,
        backupPath,
        resolvedModel: targetModel,
        reIndexedRulesCount: preparedRules.length,
        reIndexedFactsCount: preparedFacts.length,
      };
    }

    // 8. Execute atomic database transaction
    await this.database.transaction(async (tx) => {
      // Re-assert exact expected record counts inside transaction
      const [rulesCountRes] = (
        await tx.execute(sql`SELECT COUNT(*)::int as count FROM guideline_rules;`)
      ).rows as Array<{ count: number }>;
      const [factsCountRes] = (
        await tx.execute(sql`SELECT COUNT(*)::int as count FROM approved_facts;`)
      ).rows as Array<{ count: number }>;

      if (rulesCountRes.count !== EXPECTED_GUIDELINE_RULE_IDS.length) {
        throw new Error(
          `Row count mismatch inside tx: expected ${EXPECTED_GUIDELINE_RULE_IDS.length} rules, found ${rulesCountRes.count}`
        );
      }
      if (factsCountRes.count !== EXPECTED_APPROVED_FACT_IDS.length) {
        throw new Error(
          `Row count mismatch inside tx: expected ${EXPECTED_APPROVED_FACT_IDS.length} facts, found ${factsCountRes.count}`
        );
      }

      // Update guideline_rules
      for (const rule of preparedRules) {
        const res = await tx
          .update(guidelineRules)
          .set({
            embedding: rule.embedding,
            metadata: rule.metadata,
          })
          .where(eq(guidelineRules.id, rule.id));
        if (res.rowCount !== 1) {
          throw new Error(
            `Update affected ${res.rowCount} rows for rule ${rule.id}, strictly expected 1`
          );
        }
      }

      // Update approved_facts
      for (const fact of preparedFacts) {
        const res = await tx
          .update(approvedFacts)
          .set({
            embedding: fact.embedding,
            metadata: fact.metadata,
          })
          .where(eq(approvedFacts.id, fact.id));
        if (res.rowCount !== 1) {
          throw new Error(
            `Update affected ${res.rowCount} rows for fact ${fact.id}, strictly expected 1`
          );
        }
      }

      // Verify metadata stamps inside transaction before commit
      const [verifiedRules] = (
        await tx.execute(sql`
          SELECT COUNT(*)::int as count 
          FROM guideline_rules 
          WHERE metadata->>'embeddingModel' = ${targetModel};
        `)
      ).rows as Array<{ count: number }>;

      const [verifiedFacts] = (
        await tx.execute(sql`
          SELECT COUNT(*)::int as count 
          FROM approved_facts 
          WHERE metadata->>'embeddingModel' = ${targetModel};
        `)
      ).rows as Array<{ count: number }>;

      if (verifiedRules.count !== EXPECTED_GUIDELINE_RULE_IDS.length) {
        throw new Error(
          `Metadata verification failed: expected ${EXPECTED_GUIDELINE_RULE_IDS.length} updated rules, found ${verifiedRules.count}`
        );
      }
      if (verifiedFacts.count !== EXPECTED_APPROVED_FACT_IDS.length) {
        throw new Error(
          `Metadata verification failed: expected ${EXPECTED_APPROVED_FACT_IDS.length} updated facts, found ${verifiedFacts.count}`
        );
      }
    });

    console.log(
      JSON.stringify({
        type: 'EMBEDDING_MIGRATION_COMMITTED',
        targetModel,
        reIndexedRulesCount: preparedRules.length,
        reIndexedFactsCount: preparedFacts.length,
      })
    );

    return {
      success: true,
      dryRun: false,
      backupPath,
      resolvedModel: targetModel,
      reIndexedRulesCount: preparedRules.length,
      reIndexedFactsCount: preparedFacts.length,
    };
    } finally {
      if (ownedClient) {
        try {
          await MaintenanceGate.releaseGlobalExclusiveLock(ownedClient);
        } catch (releaseErr) {
          console.error('[EmbeddingMigrationManager] Error releasing exclusive lock:', releaseErr);
        }
        ownedClient.release();
      }
    }
  }

  public async rollbackMigration(options: RollbackOptions): Promise<RollbackResult> {
    if (!fs.existsSync(options.backupPath)) {
      throw new Error(`Backup file not found at path: ${options.backupPath}`);
    }

    const fileContent = fs.readFileSync(options.backupPath, 'utf-8');
    const backup = JSON.parse(fileContent) as MigrationBackupFile;
    validateBackupPayload(backup);

    let ownedClient: PoolClientLike | null = null;
    if (!options.exclusiveClient && this.pool) {
      ownedClient = await this.pool.connect();
      await MaintenanceGate.acquireGlobalExclusiveLock(ownedClient);
    }

    try {
      console.log(
        JSON.stringify({
          type: 'EMBEDDING_ROLLBACK_INITIATED',
          backupPath: options.backupPath,
          sourceModel: backup.sourceModel,
          timestamp: backup.timestamp,
        })
      );

    await this.database.transaction(async (tx) => {
      // Re-assert existing IDs
      const currentRules = (
        await tx.execute(sql`SELECT id FROM guideline_rules;`)
      ).rows as Array<{ id: string }>;
      const currentFacts = (
        await tx.execute(sql`SELECT id FROM approved_facts;`)
      ).rows as Array<{ id: string }>;

      validateRecordIds(currentRules, EXPECTED_GUIDELINE_RULE_IDS, 'rollback guideline_rules');
      validateRecordIds(currentFacts, EXPECTED_APPROVED_FACT_IDS, 'rollback approved_facts');

      // Restore guideline_rules
      for (const rule of backup.guidelineRules) {
        const res = await tx
          .update(guidelineRules)
          .set({
            embedding: rule.embedding,
            metadata: rule.metadata,
          })
          .where(eq(guidelineRules.id, rule.id));
        if (res.rowCount !== 1) {
          throw new Error(
            `Rollback update affected ${res.rowCount} rows for rule ${rule.id}, expected 1`
          );
        }
      }

      // Restore approved_facts
      for (const fact of backup.approvedFacts) {
        const res = await tx
          .update(approvedFacts)
          .set({
            embedding: fact.embedding,
            metadata: fact.metadata,
          })
          .where(eq(approvedFacts.id, fact.id));
        if (res.rowCount !== 1) {
          throw new Error(
            `Rollback update affected ${res.rowCount} rows for fact ${fact.id}, expected 1`
          );
        }
      }

      // Comprehensive Verification Before Commit:
      // Verify exact UUID sets, exact metadata, and exact restored vector values
      const restoredRuleRows = (
        await tx.execute(sql`
          SELECT id, metadata, embedding::text as vec_text 
          FROM guideline_rules;
        `)
      ).rows as Array<{ id: string; metadata: any; vec_text: string }>;

      const restoredFactRows = (
        await tx.execute(sql`
          SELECT id, COALESCE(to_jsonb(approved_facts.*)->'metadata', '{}'::jsonb) as metadata, embedding::text as vec_text 
          FROM approved_facts;
        `)
      ).rows as Array<{ id: string; metadata: any; vec_text: string }>;

      if (
        restoredRuleRows.length !== EXPECTED_GUIDELINE_RULE_IDS.length ||
        restoredFactRows.length !== EXPECTED_APPROVED_FACT_IDS.length
      ) {
        throw new Error(
          `Rollback verification failed: record count mismatch`
        );
      }

      const backupRulesMap = new Map(backup.guidelineRules.map((r) => [r.id, r]));
      for (const row of restoredRuleRows) {
        const original = backupRulesMap.get(row.id);
        if (!original) throw new Error(`Missing original backup for rule ${row.id}`);
        const restoredVec = JSON.parse(row.vec_text) as number[];
        if (
          restoredVec.length !== EXPECTED_VECTOR_DIMENSIONS ||
          !restoredVec.every((v, i) => Math.abs(v - original.embedding[i]) < 1e-6)
        ) {
          throw new Error(`Rollback verification failed: vector value mismatch for rule ${row.id}`);
        }
      }

      const backupFactsMap = new Map(backup.approvedFacts.map((f) => [f.id, f]));
      for (const row of restoredFactRows) {
        const original = backupFactsMap.get(row.id);
        if (!original) throw new Error(`Missing original backup for fact ${row.id}`);
        const restoredVec = JSON.parse(row.vec_text) as number[];
        if (
          restoredVec.length !== EXPECTED_VECTOR_DIMENSIONS ||
          !restoredVec.every((v, i) => Math.abs(v - original.embedding[i]) < 1e-6)
        ) {
          throw new Error(`Rollback verification failed: vector value mismatch for fact ${row.id}`);
        }
      }
    });

    console.log(
      JSON.stringify({
        type: 'EMBEDDING_ROLLBACK_COMMITTED',
        restoredRulesCount: backup.guidelineRules.length,
        restoredFactsCount: backup.approvedFacts.length,
      })
    );

    return {
      success: true,
      restoredRulesCount: backup.guidelineRules.length,
      restoredFactsCount: backup.approvedFacts.length,
    };
    } finally {
      if (ownedClient) {
        try {
          await MaintenanceGate.releaseGlobalExclusiveLock(ownedClient);
        } catch (releaseErr) {
          console.error('[EmbeddingMigrationManager] Error releasing exclusive lock on rollback:', releaseErr);
        }
        ownedClient.release();
      }
    }
  }
}
