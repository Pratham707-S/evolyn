import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    KnowledgeRepository,
} from '../modules/knowledge/knowledge.repository.js';

import type {
    ApprovedFactRecord,
} from '../modules/knowledge/knowledge.repository.js';

import type {
    CreateApprovedFactInput,
} from '@evolyn/shared';

import type { db } from '../db/index.js';

const createdAt = new Date('2026-11-05T10:00:00.000Z');

const mockFact: ApprovedFactRecord = {
    id: 'fact-123',
    topic: 'Company',
    claimStatement: 'Company was founded in 2020.',
    approvedProofSource: 'https://example.com/about',
    validUntil: null,
    embedding: Array(768).fill(0.1),
    createdAt,
};

const validInput: CreateApprovedFactInput = {
    topic: 'Company',
    claimStatement: 'Company was founded in 2020.',
    approvedProofSource: 'https://example.com/about',
    validUntil: null,
};

function createSelectQuery(rows: unknown[]) {
    const query = {
        from: () => query,
        where: () => query,
        orderBy: () => query,
        limit: async () => rows,
        then: (
            resolve: (value: unknown[]) => unknown,
            reject?: (reason: unknown) => unknown,
        ) => Promise.resolve(rows).then(resolve, reject),
    };

    return query;
}

function createRepositoryMock(
    options: {
        selectRows?: unknown[];
        returningRows?: unknown[];
    } = {},
) {
    const selectRows = options.selectRows ?? [mockFact];
    const returningRows = options.returningRows ?? [mockFact];

    const database = {
        select: () => createSelectQuery(selectRows),

        insert: () => ({
            values: (_values: unknown) => ({
                returning: async () => returningRows,
            }),
        }),

        update: () => ({
            set: (_values: unknown) => ({
                where: (_condition: unknown) => ({
                    returning: async () => returningRows,
                }),
            }),
        }),
    };

    return database as unknown as typeof db;
}

describe('KnowledgeRepository', () => {
    it('creates an approved fact successfully', async () => {
        const repository = new KnowledgeRepository(
            createRepositoryMock(),
        );

        const result = await repository.create(validInput);

        assert.equal(result.id, 'fact-123');
        assert.equal(result.topic, 'Company');
        assert.equal(
            result.claimStatement,
            'Company was founded in 2020.',
        );
    });

    it('throws when fact creation returns no record', async () => {
        const repository = new KnowledgeRepository(
            createRepositoryMock({ returningRows: [] }),
        );

        await assert.rejects(
            repository.create(validInput),
            { message: 'Failed to create approved fact' },
        );
    });

    it('retrieves all approved facts', async () => {
        const repository = new KnowledgeRepository(
            createRepositoryMock(),
        );

        const result = await repository.findMany();

        assert.equal(result.length, 1);
        assert.equal(result[0]?.id, 'fact-123');
    });

    it('retrieves facts by topic', async () => {
        const repository = new KnowledgeRepository(
            createRepositoryMock(),
        );

        const result = await repository.findByTopic('Company');

        assert.equal(result.length, 1);
        assert.equal(result[0]?.topic, 'Company');
    });

    it('retrieves semantically relevant facts', async () => {
        const distance = 0.15;

        const repository = new KnowledgeRepository(
            createRepositoryMock({
                selectRows: [{
                    ...mockFact,
                    distance,
                }],
            }),
        );

        const result = await repository.findRelevantFacts(
            Array(768).fill(0.1),
        );

        assert.equal(result.length, 1);
        assert.equal(result[0]?.id, 'fact-123');
        assert.ok(
            Math.abs((result[0]?.similarity ?? 0) - 0.85) < 0.000001,
        );
    });

    it('returns an empty array when no facts have embeddings', async () => {
        const repository = new KnowledgeRepository(
            createRepositoryMock({ selectRows: [] }),
        );

        const result = await repository.findFactsWithoutEmbeddings();

        assert.deepEqual(result, []);
    });

    it('updates an approved fact embedding', async () => {
        const repository = new KnowledgeRepository(
            createRepositoryMock(),
        );

        const embedding = Array(768).fill(0.2);

        const result = await repository.updateEmbedding(
            'fact-123',
            embedding,
        );

        assert.equal(result.id, 'fact-123');
        assert.equal(result.embedding?.length, 768);
    });

    it('throws when embedding update returns no record', async () => {
        const repository = new KnowledgeRepository(
            createRepositoryMock({ returningRows: [] }),
        );

        await assert.rejects(
            repository.updateEmbedding(
                'missing-fact',
                Array(768).fill(0.2),
            ),
            { message: 'Failed to update embedding for fact: missing-fact' },
        );
    });
});
