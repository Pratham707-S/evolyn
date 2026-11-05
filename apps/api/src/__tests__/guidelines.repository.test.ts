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

    it('fetches only rules without embeddings for a guideline', async () => {
        const expectedRules = [
            {
                id: 'rule-1',
                guidelineId: 'guideline-123',
                ruleType: 'MANDATORY',
                ruleStatement: 'Use the official logo.',
                explanation: 'Brand consistency.',
                severity: 'CRITICAL',
                embedding: null,
                metadata: {},
                createdAt: new Date(),
            },
        ];

        let whereCalled = false;
        let orderByCalled = false;

        const fakeDatabase = {
            select: () => ({
                from: () => ({
                    where: () => {
                        whereCalled = true;
                        return {
                            orderBy: async () => {
                                orderByCalled = true;
                                return expectedRules;
                            },
                        };
                    },
                }),
            }),
        } as unknown as typeof db;

        const repository = new GuidelinesRepository(fakeDatabase);

        const result = await repository.findRulesWithoutEmbeddings(
            'guideline-123',
        );

        assert.deepEqual(result, expectedRules);
        assert.equal(whereCalled, true);
        assert.equal(orderByCalled, true);
    });

    it('updates and returns a rule embedding', async () => {
        const embedding = Array(768).fill(0.1);

        const updatedRule = {
            id: 'rule-1',
            guidelineId: 'guideline-123',
            ruleType: 'MANDATORY',
            ruleStatement: 'Use the official logo.',
            explanation: 'Brand consistency.',
            severity: 'CRITICAL',
            embedding,
            metadata: {},
            createdAt: new Date(),
        };

        let capturedValues: unknown;

        const fakeDatabase = {
            update: () => ({
                set: (values: unknown) => {
                    capturedValues = values;

                    return {
                        where: () => ({
                            returning: async () => [updatedRule],
                        }),
                    };
                },
            }),
        } as unknown as typeof db;

        const repository = new GuidelinesRepository(fakeDatabase);

        const result = await repository.updateRuleEmbedding(
            'rule-1',
            embedding,
        );

        assert.deepEqual(capturedValues, { embedding });
        assert.deepEqual(result, updatedRule);
    });
});