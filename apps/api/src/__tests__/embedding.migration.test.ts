import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  MaintenanceGate,
  MaintenanceGateActiveError,
  defaultMaintenanceGate,
} from '../modules/maintenance/maintenance-gate.js';
import {
  EmbeddingMigrationManager,
  EXPECTED_GUIDELINE_RULE_IDS,
  EXPECTED_APPROVED_FACT_IDS,
  EXPECTED_VECTOR_DIMENSIONS,
  validateRecordIds,
  validateVectors,
  validateBackupPayload,
  computePayloadChecksum,
  type MigrationBackupFile,
} from '../modules/maintenance/migration-manager.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { GeminiAIProvider } from '../infrastructure/ai/gemini.provider.js';

function createMockResponse(payload: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => payload,
    text: async () => (typeof payload === 'string' ? payload : JSON.stringify(payload)),
  } as unknown as Response;
}

describe('Embedding Migration & Maintenance Gate Hardening', () => {
  describe('MaintenanceGate', () => {
    it('allows operational execution when maintenance is inactive', async () => {
      const gate = new MaintenanceGate();
      await assert.doesNotReject(() => gate.assertOperational());
    });

    it('rejects with MaintenanceGateActiveError when local maintenance is active', async () => {
      const gate = new MaintenanceGate();
      gate.setLocalActive(true, 'Test migration active');
      await assert.rejects(
        () => gate.assertOperational(),
        (err: Error) => {
          assert.ok(err instanceof MaintenanceGateActiveError);
          assert.equal((err as MaintenanceGateActiveError).code, 'MAINTENANCE_GATE_ACTIVE');
          assert.ok(err.message.includes('Test migration active'));
          return true;
        }
      );
    });

    it('returns HTTP 503 with Retry-After: 15 on MaintenanceGateActiveError in Express middleware', () => {
      const err = new MaintenanceGateActiveError('Test maintenance');
      let capturedStatus = 0;
      let capturedPayload: any = null;
      const headers: Record<string, string> = {};

      const mockRes: any = {
        setHeader: (k: string, v: string) => {
          headers[k.toLowerCase()] = v;
        },
        status: (code: number) => {
          capturedStatus = code;
          return mockRes;
        },
        json: (payload: any) => {
          capturedPayload = payload;
          return mockRes;
        },
      };

      errorHandler(err, {} as any, mockRes, () => {});

      assert.equal(capturedStatus, 503);
      assert.equal(headers['retry-after'], '15');
      assert.deepEqual(capturedPayload, {
        error:
          'Brand governance pipeline is temporarily locked for active embedding re-indexing. Please retry shortly.',
        code: 'MAINTENANCE_GATE_ACTIVE',
      });
    });
  });

  describe('Validation Functions', () => {
    it('validates exact expected record IDs and rejects unknown UUIDs', () => {
      const validRules = EXPECTED_GUIDELINE_RULE_IDS.map((id) => ({ id }));
      assert.doesNotThrow(() => validateRecordIds(validRules, EXPECTED_GUIDELINE_RULE_IDS, 'rules'));

      const invalidRules = [
        { id: EXPECTED_GUIDELINE_RULE_IDS[0] },
        { id: '00000000-0000-0000-0000-000000000000' },
        { id: EXPECTED_GUIDELINE_RULE_IDS[2] },
        { id: EXPECTED_GUIDELINE_RULE_IDS[3] },
      ];
      assert.throws(
        () => validateRecordIds(invalidRules, EXPECTED_GUIDELINE_RULE_IDS, 'rules'),
        /Unexpected rules record ID/
      );
    });

    it('rejects if count of record IDs is fewer or greater than expected', () => {
      const tooFew = [{ id: EXPECTED_GUIDELINE_RULE_IDS[0] }];
      assert.throws(
        () => validateRecordIds(tooFew, EXPECTED_GUIDELINE_RULE_IDS, 'rules'),
        /Record count mismatch/
      );
    });

    it('validates 768-dim finite vectors and rejects invalid dimensions or NaN', () => {
      const valid = [{ id: 'rule-1', embedding: Array(768).fill(0.1) }];
      assert.doesNotThrow(() => validateVectors(valid, 'rules'));

      const invalidDim = [{ id: 'rule-1', embedding: Array(512).fill(0.1) }];
      assert.throws(() => validateVectors(invalidDim, 'rules'), /must contain 768 finite floats/);

      const invalidNaN = [{ id: 'rule-1', embedding: Array(768).fill(0.1) }];
      invalidNaN[0].embedding[10] = NaN;
      assert.throws(() => validateVectors(invalidNaN, 'rules'), /must contain 768 finite floats/);

      const invalidInf = [{ id: 'rule-1', embedding: Array(768).fill(0.1) }];
      invalidInf[0].embedding[10] = Infinity;
      assert.throws(() => validateVectors(invalidInf, 'rules'), /must contain 768 finite floats/);
    });

    it('detects checksum tampering in backup payloads', () => {
      const rules = EXPECTED_GUIDELINE_RULE_IDS.map((id) => ({
        id,
        text: 'rule text',
        metadata: { cat: 'legal' },
        embedding: Array(768).fill(0.01),
      }));
      const facts = EXPECTED_APPROVED_FACT_IDS.map((id) => ({
        id,
        text: 'fact text',
        metadata: {},
        embedding: Array(768).fill(0.02),
      }));

      const checksum = computePayloadChecksum(rules, facts);
      const backup: MigrationBackupFile = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        sourceModel: 'text-embedding-004',
        targetModel: 'gemini-embedding-2',
        expectedDimensions: EXPECTED_VECTOR_DIMENSIONS,
        sha256Checksum: checksum,
        guidelineRules: rules,
        approvedFacts: facts,
      };

      assert.doesNotThrow(() => validateBackupPayload(backup));

      // Tamper with text
      const tamperedBackup = {
        ...backup,
        guidelineRules: [
          { ...rules[0], text: 'tampered statement' },
          ...rules.slice(1),
        ],
      };
      assert.throws(
        () => validateBackupPayload(tamperedBackup),
        /Backup checksum verification failed/
      );
    });
  });

  describe('EmbeddingMigrationManager Logic', () => {
    it('executes a dry run with zero database writes and creates a verified backup', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evolyn-test-dryrun-'));
      let dbWritesCount = 0;

      const mockRulesRows = EXPECTED_GUIDELINE_RULE_IDS.map((id) => ({
        id,
        rule_statement: `Statement for ${id}`,
        metadata: { category: 'Compliance' },
        vec_text: JSON.stringify(Array(768).fill(0.05)),
      }));

      const mockFactsRows = EXPECTED_APPROVED_FACT_IDS.map((id) => ({
        id,
        claim_statement: `Claim for ${id}`,
        metadata: {},
        vec_text: JSON.stringify(Array(768).fill(0.06)),
      }));

      const mockDb: any = {
        execute: async (query: any) => {
          const str = String(query?.queryChunks?.[0]?.value || query);
          if (str.includes('UPDATE') || str.includes('INSERT') || str.includes('DELETE')) {
            dbWritesCount++;
          }
          if (str.includes('guideline_rules')) {
            return { rows: mockRulesRows };
          }
          if (str.includes('approved_facts')) {
            return { rows: mockFactsRows };
          }
          return { rows: [] };
        },
        transaction: async () => {
          dbWritesCount++;
        },
      };

      const mockProvider = new GeminiAIProvider(
        'mock-key',
        'gemini-flash-lite-latest',
        'gemini-embedding-2',
        async () => createMockResponse({
          embedding: { values: Array(768).fill(0.08) },
        })
      );

      const manager = new EmbeddingMigrationManager(mockDb);
      const result = await manager.runMigration({
        dryRun: true,
        backupDir: tempDir,
        provider: mockProvider,
        targetModel: 'gemini-embedding-2',
      });

      assert.equal(result.success, true);
      assert.equal(result.dryRun, true);
      assert.equal(result.reIndexedRulesCount, 4);
      assert.equal(result.reIndexedFactsCount, 3);
      assert.equal(result.resolvedModel, 'gemini-embedding-2');
      assert.equal(dbWritesCount, 0, 'Dry run must perform zero database writes');
      assert.ok(fs.existsSync(result.backupPath));

      // Clean up temp file
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('strictly forbids silent model fallback during migration', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evolyn-test-fallback-'));

      const mockRulesRows = EXPECTED_GUIDELINE_RULE_IDS.map((id) => ({
        id,
        rule_statement: `Statement for ${id}`,
        metadata: {},
        vec_text: JSON.stringify(Array(768).fill(0.05)),
      }));

      const mockFactsRows = EXPECTED_APPROVED_FACT_IDS.map((id) => ({
        id,
        claim_statement: `Claim for ${id}`,
        metadata: {},
        vec_text: JSON.stringify(Array(768).fill(0.06)),
      }));

      const mockDb: any = {
        execute: async (query: any) => {
          const str = String(query?.queryChunks?.[0]?.value || query);
          if (str.includes('guideline_rules')) return { rows: mockRulesRows };
          if (str.includes('approved_facts')) return { rows: mockFactsRows };
          return { rows: [] };
        },
      };

      // Provider that falls back to a different model on 404
      const fallbackProvider = new GeminiAIProvider(
        'mock-key',
        'gemini-flash-lite-latest',
        'gemini-embedding-custom',
        async (input) => {
          const urlStr = String(input);
          if (urlStr.includes('gemini-embedding-custom')) {
            return createMockResponse({ error: 'not found' }, false, 404);
          }
          return createMockResponse({
            embedding: { values: Array(768).fill(0.08) },
          });
        }
      );

      const manager = new EmbeddingMigrationManager(mockDb);
      await assert.rejects(
        () =>
          manager.runMigration({
            dryRun: true,
            backupDir: tempDir,
            provider: fallbackProvider,
            targetModel: 'gemini-embedding-custom', // Expects custom, but provider falls back to gemini-embedding-2
          }),
        /Silent fallback/i
      );

      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('rolls back completely if any database update affects unexpected rowCount', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evolyn-test-tx-'));

      const mockRulesRows = EXPECTED_GUIDELINE_RULE_IDS.map((id) => ({
        id,
        rule_statement: `Statement for ${id}`,
        metadata: {},
        vec_text: JSON.stringify(Array(768).fill(0.05)),
      }));

      const mockFactsRows = EXPECTED_APPROVED_FACT_IDS.map((id) => ({
        id,
        claim_statement: `Claim for ${id}`,
        metadata: {},
        vec_text: JSON.stringify(Array(768).fill(0.06)),
      }));

      let txRolledBack = false;
      const mockDb: any = {
        execute: async (query: any) => {
          const str = String(query?.queryChunks?.[0]?.value || query);
          if (str.includes('guideline_rules')) return { rows: mockRulesRows };
          if (str.includes('approved_facts')) return { rows: mockFactsRows };
          return { rows: [] };
        },
        transaction: async (callback: any) => {
          try {
            const mockTx: any = {
              execute: async (q: any) => {
                const str = String(q?.queryChunks?.[0]?.value || q);
                if (str.includes('COUNT')) {
                  if (str.includes('guideline_rules')) return { rows: [{ count: 4 }] };
                  if (str.includes('approved_facts')) return { rows: [{ count: 3 }] };
                }
                return { rows: [] };
              },
              update: () => ({
                set: () => ({
                  where: async () => ({ rowCount: 0 }), // SIMULATE UPDATE FAILURE (0 rows affected)
                }),
              }),
            };
            return await callback(mockTx);
          } catch (err) {
            txRolledBack = true;
            throw err;
          }
        },
      };

      const mockProvider = new GeminiAIProvider(
        'mock-key',
        'gemini-flash-lite-latest',
        'gemini-embedding-2',
        async () => createMockResponse({
          embedding: { values: Array(768).fill(0.08) },
        })
      );

      const manager = new EmbeddingMigrationManager(mockDb);
      await assert.rejects(
        () =>
          manager.runMigration({
            dryRun: false,
            backupDir: tempDir,
            provider: mockProvider,
            targetModel: 'gemini-embedding-2',
          }),
        /Update affected 0 rows/
      );

      assert.equal(txRolledBack, true, 'Transaction must roll back on rowCount failure');
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('hardens rollback by validating backup integrity and verifying all 7 records before commit', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evolyn-test-rb-'));

      const rules = EXPECTED_GUIDELINE_RULE_IDS.map((id) => ({
        id,
        text: 'rule statement',
        metadata: { cat: 'brand' },
        embedding: Array(768).fill(0.01),
      }));
      const facts = EXPECTED_APPROVED_FACT_IDS.map((id) => ({
        id,
        text: 'fact statement',
        metadata: {},
        embedding: Array(768).fill(0.02),
      }));

      const checksum = computePayloadChecksum(rules, facts);
      const backupPath = path.join(tempDir, 'valid-backup.json');
      fs.writeFileSync(
        backupPath,
        JSON.stringify({
          version: '1.0',
          timestamp: new Date().toISOString(),
          sourceModel: 'text-embedding-004',
          targetModel: 'gemini-embedding-2',
          expectedDimensions: EXPECTED_VECTOR_DIMENSIONS,
          sha256Checksum: checksum,
          guidelineRules: rules,
          approvedFacts: facts,
        })
      );

      let txCommitted = false;
      const mockDb: any = {
        transaction: async (callback: any) => {
          const mockTx: any = {
            execute: async (q: any) => {
              const str = String(q?.queryChunks?.[0]?.value || q);
              if (str.includes('vec_text') && str.includes('guideline_rules')) {
                return { rows: rules.map((r) => ({ id: r.id, metadata: r.metadata, vec_text: JSON.stringify(r.embedding) })) };
              }
              if (str.includes('vec_text') && str.includes('approved_facts')) {
                return { rows: facts.map((f) => ({ id: f.id, metadata: f.metadata, vec_text: JSON.stringify(f.embedding) })) };
              }
              if (str.includes('SELECT id FROM guideline_rules')) {
                return { rows: EXPECTED_GUIDELINE_RULE_IDS.map((id) => ({ id })) };
              }
              if (str.includes('SELECT id FROM approved_facts')) {
                return { rows: EXPECTED_APPROVED_FACT_IDS.map((id) => ({ id })) };
              }
              if (str.includes('COUNT')) {
                if (str.includes('guideline_rules')) return { rows: [{ count: 4 }] };
                if (str.includes('approved_facts')) return { rows: [{ count: 3 }] };
              }
              return { rows: [] };
            },
            update: () => ({
              set: () => ({
                where: async () => ({ rowCount: 1 }),
              }),
            }),
          };
          const res = await callback(mockTx);
          txCommitted = true;
          return res;
        },
      };

      const manager = new EmbeddingMigrationManager(mockDb);
      const rbResult = await manager.rollbackMigration({ backupPath });

      assert.equal(rbResult.success, true);
      assert.equal(rbResult.restoredRulesCount, 4);
      assert.equal(rbResult.restoredFactsCount, 3);
      assert.equal(txCommitted, true);

      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  describe('PostgreSQL Shared & Exclusive Advisory Lock Concurrency', () => {
    class MockPostgresCluster {
      public exclusiveHolder: string | null = null;
      public sharedHolders = new Set<string>();

      createClient(clientId: string) {
        let connected = true;
        return {
          clientId,
          isConnected: () => connected,
          disconnect: () => {
            connected = false;
            if (this.exclusiveHolder === clientId) this.exclusiveHolder = null;
            this.sharedHolders.delete(clientId);
          },
          query: async (sqlText: string) => {
            if (!connected) throw new Error('Connection terminated');

            if (sqlText.includes('pg_try_advisory_lock_shared')) {
              if (this.exclusiveHolder !== null && this.exclusiveHolder !== clientId) {
                return { rows: [{ acquired: false }] };
              }
              this.sharedHolders.add(clientId);
              return { rows: [{ acquired: true }] };
            }

            if (sqlText.includes('pg_advisory_unlock_shared')) {
              this.sharedHolders.delete(clientId);
              return { rows: [{ unlocked: true }] };
            }

            if (sqlText.includes('pg_try_advisory_lock')) {
              if (this.exclusiveHolder !== null || this.sharedHolders.size > 0) {
                return { rows: [{ acquired: false }] };
              }
              this.exclusiveHolder = clientId;
              return { rows: [{ acquired: true }] };
            }

            if (sqlText.includes('pg_advisory_unlock')) {
              if (this.exclusiveHolder === clientId) {
                this.exclusiveHolder = null;
              }
              return { rows: [{ unlocked: true }] };
            }

            return { rows: [] };
          },
          release: () => {},
        };
      }

      createPool(poolName: string) {
        let clientCounter = 0;
        return {
          connect: async () => this.createClient(`${poolName}-${++clientCounter}`),
        };
      }
    }

    it('blocks migration from starting while an active review holds a shared advisory lock', async () => {
      const cluster = new MockPostgresCluster();
      const appPool = cluster.createPool('render-api-1');
      const gate = new MaintenanceGate(appPool);

      let reviewActive = true;
      let reviewCompleted = false;

      // Start long-running review holding shared lock
      const reviewPromise = gate.withSharedLock(async () => {
        while (reviewActive) {
          await new Promise((r) => setTimeout(r, 20));
        }
        reviewCompleted = true;
        return 'review-result';
      });

      // Wait until shared lock is acquired by review
      await new Promise((r) => setTimeout(r, 10));
      assert.equal(cluster.sharedHolders.size, 1);

      // Attempt migration while review is running (short timeout to assert blocking)
      const migrationClient = cluster.createClient('migration-runner');
      await assert.rejects(
        () => MaintenanceGate.acquireGlobalExclusiveLock(migrationClient, 100, 20),
        /Could not acquire exclusive migration lock within 100ms/
      );

      // Allow review to finish
      reviewActive = false;
      const res = await reviewPromise;
      assert.equal(res, 'review-result');
      assert.equal(reviewCompleted, true);
      assert.equal(cluster.sharedHolders.size, 0);

      // Now migration can acquire exclusive lock
      await assert.doesNotReject(() =>
        MaintenanceGate.acquireGlobalExclusiveLock(migrationClient, 500, 20)
      );
      assert.equal(cluster.exclusiveHolder, 'migration-runner');

      await MaintenanceGate.releaseGlobalExclusiveLock(migrationClient);
      assert.equal(cluster.exclusiveHolder, null);
    });

    it('rejects new review with MaintenanceGateActiveError while migration holds exclusive lock', async () => {
      const cluster = new MockPostgresCluster();
      const appPool = cluster.createPool('render-api-2');
      const gate = new MaintenanceGate(appPool);

      const migrationClient = cluster.createClient('migration-runner-2');
      await MaintenanceGate.acquireGlobalExclusiveLock(migrationClient, 500, 20);
      assert.equal(cluster.exclusiveHolder, 'migration-runner-2');

      // Incoming review arrives while migration is running
      await assert.rejects(
        () => gate.withSharedLock(async () => 'should-be-blocked'),
        (err: Error) => {
          assert.ok(err instanceof MaintenanceGateActiveError);
          return true;
        }
      );

      // Migration completes and releases lock
      await MaintenanceGate.releaseGlobalExclusiveLock(migrationClient);
      assert.equal(cluster.exclusiveHolder, null);

      // Subsequent review succeeds
      const result = await gate.withSharedLock(async () => 'review-succeeded');
      assert.equal(result, 'review-succeeded');
    });

    it('allows two concurrent ingestion operations to execute simultaneously with shared locks', async () => {
      const cluster = new MockPostgresCluster();
      const appPool = cluster.createPool('render-api-ingest');
      const gate = new MaintenanceGate(appPool);

      let concurrentIngestionsCount = 0;
      let maxConcurrencyObserved = 0;

      const runIngest = async (id: number) => {
        return await gate.withSharedLock(async () => {
          concurrentIngestionsCount++;
          if (concurrentIngestionsCount > maxConcurrencyObserved) {
            maxConcurrencyObserved = concurrentIngestionsCount;
          }
          await new Promise((r) => setTimeout(r, 30));
          concurrentIngestionsCount--;
          return `ingest-${id}`;
        });
      };

      const [res1, res2] = await Promise.all([runIngest(1), runIngest(2)]);
      assert.equal(res1, 'ingest-1');
      assert.equal(res2, 'ingest-2');
      assert.equal(maxConcurrencyObserved, 2, 'Both ingestions must run concurrently with shared locks');
      assert.equal(cluster.sharedHolders.size, 0);
    });

    it('releases exclusive lock automatically if migration connection disconnects unexpectedly', async () => {
      const cluster = new MockPostgresCluster();
      const appPool = cluster.createPool('render-api-survivor');
      const gate = new MaintenanceGate(appPool);

      const migrationClient = cluster.createClient('migration-crashed-runner');
      await MaintenanceGate.acquireGlobalExclusiveLock(migrationClient, 500, 20);
      assert.equal(cluster.exclusiveHolder, 'migration-crashed-runner');

      // Simulate network drop / process crash on migration runner
      migrationClient.disconnect();
      assert.equal(cluster.exclusiveHolder, null, 'PostgreSQL must clear exclusive lock on disconnect');

      // Application review immediately recovers without deadlock
      const result = await gate.withSharedLock(async () => 'recovered-review');
      assert.equal(result, 'recovered-review');
    });

    it('releases shared lock automatically if application client disconnects unexpectedly', async () => {
      const cluster = new MockPostgresCluster();
      const crashedAppClient = cluster.createClient('crashed-app-client');

      // Acquire shared lock manually on client
      await crashedAppClient.query('SELECT pg_try_advisory_lock_shared($1);');
      assert.equal(cluster.sharedHolders.size, 1);

      // Simulate app client disconnect
      crashedAppClient.disconnect();
      assert.equal(cluster.sharedHolders.size, 0, 'PostgreSQL must clear shared lock on disconnect');

      // Migration can immediately acquire exclusive lock without hanging
      const migrationClient = cluster.createClient('migration-runner-after-app-crash');
      await assert.doesNotReject(() =>
        MaintenanceGate.acquireGlobalExclusiveLock(migrationClient, 500, 20)
      );
      assert.equal(cluster.exclusiveHolder, 'migration-runner-after-app-crash');

      await MaintenanceGate.releaseGlobalExclusiveLock(migrationClient);
    });
  });
});
