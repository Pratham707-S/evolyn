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
});