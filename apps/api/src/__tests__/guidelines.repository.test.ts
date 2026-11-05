import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { db } from '../db/index.js';
import { GuidelinesRepository } from '../modules/guidelines/guidelines.repository.js';
import type { RuleExtractionResult } from '../modules/guidelines/guidelines.types.js';

const rules: RuleExtractionResult[] = [
    {
        ruleStatement: 'Always use the official logo.',
        ruleType: 'MANDATORY',
        explanation: 'Maintains brand consistency.',
        severity: 'CRITICAL',
    },
    {
        ruleStatement: 'Never distort the logo.',
        ruleType: 'PROHIBITED',
        explanation: 'Prevents incorrect logo usage.',
        severity: 'WARNING',
    },
];

describe('GuidelinesRepository', () => {
    it('inserts multiple extracted rules', async () => {
        let capturedValues: unknown;

        const insertedRecords = [
            {
                id: 'rule-1',
                guidelineId: 'guideline-123',
                ruleType: 'MANDATORY',
                ruleStatement: 'Always use the official logo.',
                explanation: 'Maintains brand consistency.',
                severity: 'CRITICAL',
                embedding: null,
                metadata: {},
                createdAt: new Date(),
            },
        ];

        const fakeDatabase = {
            insert: () => ({
                values: (values: unknown[]) => {
                    capturedValues = values;
                    return {
                        returning: async () => insertedRecords,
                    };
                },
            }),
        } as unknown as typeof db;

        const repository = new GuidelinesRepository(fakeDatabase);

        const result = await repository.createRules('guideline-123', rules);

        assert.deepEqual(capturedValues, [
            {
                guidelineId: 'guideline-123',
                ruleType: 'MANDATORY',
                ruleStatement: 'Always use the official logo.',
                explanation: 'Maintains brand consistency.',
                severity: 'CRITICAL',
            },
            {
                guidelineId: 'guideline-123',
                ruleType: 'PROHIBITED',
                ruleStatement: 'Never distort the logo.',
                explanation: 'Prevents incorrect logo usage.',
                severity: 'WARNING',
            },
        ]);
        assert.deepEqual(result, insertedRecords);
    });

    it('does not query the database when rules array is empty', async () => {
        let insertCalled = false;

        const fakeDatabase = {
            insert: () => {
                insertCalled = true;
                throw new Error('Insert should not be called');
            },
        } as unknown as typeof db;

        const repository = new GuidelinesRepository(fakeDatabase);

        const result = await repository.createRules('guideline-123', []);

        assert.deepEqual(result, []);
        assert.equal(insertCalled, false);
    });

    it('throws before any delete or insert when transaction support is unavailable', async () => {
        let deleteCalled = false;
        let insertCalled = false;

        const fakeDatabaseWithoutTransaction = {
            delete: () => {
                deleteCalled = true;
                return { where: () => Promise.resolve() };
            },
            insert: () => {
                insertCalled = true;
                return { values: () => ({ returning: async () => [] }) };
            },
        } as unknown as typeof db;

        const repository = new GuidelinesRepository(fakeDatabaseWithoutTransaction);

        await assert.rejects(
            repository.replaceRules('guideline-123', rules),
            /Database transaction support is required for atomic rule replacement/,
        );

        assert.equal(deleteCalled, false);
        assert.equal(insertCalled, false);
    });

    it('rolls back and preserves existing rules when insert fails inside transaction', async () => {
        const storedRules = [
            {
                id: 'rule-existing-1',
                guidelineId: 'guideline-123',
                ruleStatement: 'Existing rule that must not be lost.',
            },
        ];

        let deleteExecuted = false;
        let rollbackExecuted = false;

        // Transaction mock simulating atomic rollback on internal failure
        const fakeDatabase = {
            transaction: async (callback: (tx: any) => Promise<any>) => {
                const snapshot = [...storedRules];
                let workingSet = [...storedRules];

                const tx = {
                    delete: () => ({
                        where: () => {
                            deleteExecuted = true;
                            workingSet = [];
                            return Promise.resolve();
                        },
                    }),
                    insert: () => ({
                        values: () => {
                            // Simulate catastrophic failure during insertion (e.g. unique violation or DB error)
                            throw new Error('Database insert failed: unique constraint violation');
                        },
                    }),
                };

                try {
                    return await callback(tx);
                } catch (err) {
                    // Transaction aborted: restore snapshot
                    rollbackExecuted = true;
                    workingSet = snapshot;
                    throw err;
                } finally {
                    assert.deepEqual(workingSet, storedRules);
                }
            },
        } as unknown as typeof db;

        const repository = new GuidelinesRepository(fakeDatabase);

        await assert.rejects(
            repository.replaceRules('guideline-123', rules),
            /Database insert failed: unique constraint violation/,
        );

        assert.equal(deleteExecuted, true);
        assert.equal(rollbackExecuted, true);
    });

    it('atomically commits delete and insert inside transaction on successful replacement', async () => {
        let transactionExecuted = false;
        let deleteExecuted = false;
        let insertExecuted = false;

        const insertedRecords = [
            {
                id: 'rule-new-1',
                guidelineId: 'guideline-123',
                ruleType: 'MANDATORY',
                ruleStatement: 'Always use the official logo.',
                explanation: 'Maintains brand consistency.',
                severity: 'CRITICAL',
                embedding: null,
                metadata: {},
                createdAt: new Date(),
            },
        ];

        const fakeDatabase = {
            transaction: async (callback: (tx: any) => Promise<any>) => {
                transactionExecuted = true;
                const tx = {
                    delete: () => ({
                        where: () => {
                            deleteExecuted = true;
                            return Promise.resolve();
                        },
                    }),
                    insert: () => ({
                        values: () => {
                            insertExecuted = true;
                            return {
                                returning: async () => insertedRecords,
                            };
                        },
                    }),
                };
                return callback(tx);
            },
        } as unknown as typeof db;

        const repository = new GuidelinesRepository(fakeDatabase);

        const result = await repository.replaceRules('guideline-123', rules);

        assert.equal(transactionExecuted, true);
        assert.equal(deleteExecuted, true);
        assert.equal(insertExecuted, true);
        assert.deepEqual(result, insertedRecords);
    });

    describe('findConflictsByRuleIds & createConflicts (Dependency Injection & Concurrency)', () => {
        it('findConflictsByRuleIds returns [] without querying database when input is empty', async () => {
            let selectCalled = false;
            const fakeDatabase = {
                select: () => {
                    selectCalled = true;
                    return { from: () => ({ where: async () => [] }) };
                },
            } as unknown as typeof db;

            const repository = new GuidelinesRepository(fakeDatabase);
            const result = await repository.findConflictsByRuleIds([]);
            assert.deepEqual(result, []);
            assert.equal(selectCalled, false);
        });

        it('findConflictsByRuleIds queries injected database when rule IDs are provided', async () => {
            let selectCalled = false;
            const expectedConflicts = [
                {
                    id: 'c-1',
                    ruleAId: 'r-1',
                    ruleBId: 'r-2',
                    conflictType: 'CONTRADICTION',
                    explanation: 'Opposite rules',
                    severity: 'CRITICAL',
                    status: 'OPEN',
                    createdAt: new Date(),
                },
            ];

            const fakeDatabase = {
                select: () => {
                    selectCalled = true;
                    return {
                        from: () => ({
                            where: async () => expectedConflicts,
                        }),
                    };
                },
            } as unknown as typeof db;

            const repository = new GuidelinesRepository(fakeDatabase);
            const result = await repository.findConflictsByRuleIds(['r-1', 'r-2']);
            assert.equal(selectCalled, true);
            assert.deepEqual(result, expectedConflicts);
        });

        it('createConflicts normalizes rule ID ordering and deduplicates batch before inserting into injected database', async () => {
            let insertedValues: any[] = [];

            const fakeDatabase = {
                insert: () => ({
                    values: (values: any[]) => {
                        insertedValues = values;
                        return {
                            onConflictDoNothing: () => ({
                                returning: async () => values.map((v, i) => ({ id: `c-${i}`, ...v, createdAt: new Date() })),
                            }),
                        };
                    },
                }),
            } as unknown as typeof db;

            const repository = new GuidelinesRepository(fakeDatabase);

            // Pass un-normalized (r-z > r-a) and duplicate entries within same batch
            const rawConflicts = [
                {
                    ruleAId: 'r-z',
                    ruleBId: 'r-a',
                    conflictType: 'CONTRADICTION' as const,
                    explanation: 'Conflict 1',
                    severity: 'CRITICAL' as const,
                },
                // Mirror duplicate: should normalize to r-a:r-z:CONTRADICTION and be deduplicated
                {
                    ruleAId: 'r-a',
                    ruleBId: 'r-z',
                    conflictType: 'CONTRADICTION' as const,
                    explanation: 'Duplicate Conflict',
                    severity: 'CRITICAL' as const,
                },
            ];

            const result = await repository.createConflicts(rawConflicts);

            // Must have normalized to r-a (lower) and r-z (higher), deduplicated to 1 item
            assert.equal(insertedValues.length, 1);
            assert.equal(insertedValues[0].ruleAId, 'r-a');
            assert.equal(insertedValues[0].ruleBId, 'r-z');
            assert.equal(result.length, 1);
        });

        it('createConflicts rejects and skips invalid self-conflict pairs (ruleAId === ruleBId) before database insertion', async () => {
            let insertCalled = false;
            let insertedValues: any[] = [];

            const fakeDatabase = {
                insert: () => {
                    insertCalled = true;
                    return {
                        values: (values: any[]) => {
                            insertedValues = values;
                            return {
                                onConflictDoNothing: () => ({
                                    returning: async () => values.map((v, i) => ({ id: `c-${i}`, ...v, createdAt: new Date() })),
                                }),
                            };
                        },
                    };
                },
            } as unknown as typeof db;

            const repository = new GuidelinesRepository(fakeDatabase);

            // Case A: Payload containing exclusively self-conflicts
            const selfConflictsOnly = [
                {
                    ruleAId: 'rule-same-1',
                    ruleBId: 'rule-same-1',
                    conflictType: 'CONTRADICTION' as const,
                    explanation: 'Invalid self conflict',
                    severity: 'CRITICAL' as const,
                },
            ];

            const resultA = await repository.createConflicts(selfConflictsOnly);
            assert.deepEqual(resultA, []);
            assert.equal(insertCalled, false, 'Database insert must not be called when all items are self-conflicts');

            // Case B: Payload mixing a self-conflict and a valid distinct conflict pair
            const mixedConflicts = [
                {
                    ruleAId: 'rule-same-2',
                    ruleBId: 'rule-same-2',
                    conflictType: 'CONTRADICTION' as const,
                    explanation: 'Invalid self conflict',
                    severity: 'WARNING' as const,
                },
                {
                    ruleAId: 'rule-beta',
                    ruleBId: 'rule-alpha',
                    conflictType: 'CONTRADICTION' as const,
                    explanation: 'Valid distinct conflict',
                    severity: 'CRITICAL' as const,
                },
            ];

            const resultB = await repository.createConflicts(mixedConflicts);
            assert.equal(insertCalled, true);
            assert.equal(insertedValues.length, 1, 'Self-conflict must be excluded, leaving only 1 distinct pair');
            assert.equal(insertedValues[0].ruleAId, 'rule-alpha');
            assert.equal(insertedValues[0].ruleBId, 'rule-beta');
            assert.ok(insertedValues[0].ruleAId < insertedValues[0].ruleBId, 'Must enforce ruleAId < ruleBId');
            assert.equal(resultB.length, 1);
        });

        it('createConflicts handles simultaneous concurrent insertion requests safely', async () => {
            const persistedSet = new Set<string>();
            let insertCount = 0;

            const fakeDatabase = {
                insert: () => ({
                    values: (values: any[]) => ({
                        onConflictDoNothing: () => ({
                            returning: async () => {
                                insertCount += 1;
                                const inserted: any[] = [];
                                for (const v of values) {
                                    const key = `${v.ruleAId}:${v.ruleBId}:${v.conflictType}`;
                                    // Concurrency simulation: atomic check on unique index
                                    if (!persistedSet.has(key)) {
                                        persistedSet.add(key);
                                        inserted.push({ id: `c-${persistedSet.size}`, ...v, createdAt: new Date() });
                                    }
                                }
                                return inserted;
                            },
                        }),
                    }),
                }),
            } as unknown as typeof db;

            const repository = new GuidelinesRepository(fakeDatabase);

            const conflictPayload = [
                {
                    ruleAId: 'rule-beta',
                    ruleBId: 'rule-alpha',
                    conflictType: 'CONTRADICTION' as const,
                    explanation: 'Same contradiction simultaneously detected',
                    severity: 'CRITICAL' as const,
                },
            ];

            // Run 5 simultaneous concurrent insertion calls (simulating parallel requests)
            const concurrentResults = await Promise.all([
                repository.createConflicts(conflictPayload),
                repository.createConflicts(conflictPayload),
                repository.createConflicts(conflictPayload),
                repository.createConflicts(conflictPayload),
                repository.createConflicts(conflictPayload),
            ]);

            assert.equal(insertCount, 5);
            // Exactly 1 insert succeeded in persisting, others were handled via onConflictDoNothing
            const totalPersisted = concurrentResults.flat();
            assert.equal(totalPersisted.length, 1);
            assert.equal(persistedSet.size, 1);
            assert.ok(persistedSet.has('rule-alpha:rule-beta:CONTRADICTION'));
        });
    });
});
