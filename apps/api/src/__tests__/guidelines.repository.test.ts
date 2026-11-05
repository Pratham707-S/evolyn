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
});
