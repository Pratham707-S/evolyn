import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import type {
    ApprovedFact,
    CreateApprovedFactInput,
} from '@evolyn/shared';

import {
    KnowledgeService,
} from '../modules/knowledge/knowledge.service.js';

import type {
    KnowledgeRepository,
} from '../modules/knowledge/knowledge.repository.js';

import type {
    FactEmbeddingGenerator,
} from '../modules/knowledge/knowledge.types.js';

import type {
    ApprovedFactRecord,
    RelevantFactRecord,
} from '../modules/knowledge/knowledge.repository.js';

const mockFact: ApprovedFactRecord = {
    id: 'fact-1',
    topic: 'Product',
    claimStatement: 'Our product supports secure cloud storage.',
    approvedProofSource: 'https://example.com/proof',
    validUntil: null,
    embedding: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const validInput: CreateApprovedFactInput = {
    topic: 'Product',
    claimStatement: 'Our product supports secure cloud storage.',
    approvedProofSource: 'https://example.com/proof',
    validUntil: null,
};

function createRepositoryMock() {
    return {
        create: async (_input: CreateApprovedFactInput) => mockFact,
        findMany: async (_topic?: string) => [mockFact],
        findRelevantFacts: async (
            _vector: number[],
            _limit?: number,
        ): Promise<RelevantFactRecord[]> => [
            { ...mockFact, similarity: 0.85 },
        ],
        findFactsWithoutEmbeddings: async () => [mockFact],
        updateEmbedding: async (
            _id: string,
            embedding: number[],
        ) => ({ ...mockFact, embedding }),
    };
}

describe('KnowledgeService', () => {
    let repository: ReturnType<typeof createRepositoryMock>;
    let service: KnowledgeService;

    beforeEach(() => {
        repository = createRepositoryMock();
        service = new KnowledgeService(
            repository as unknown as KnowledgeRepository,
        );
    });

    it('creates an approved fact successfully', async () => {
        const result = await service.createFact(validInput);

        assert.equal(result.id, 'fact-1');
        assert.equal(result.topic, 'Product');
        assert.equal(
            result.createdAt,
            '2026-01-01T00:00:00.000Z',
        );
        assert.equal(result.validUntil, null);
    });

    it('rejects invalid approved fact input', async () => {
        await assert.rejects(
            service.createFact({
                ...validInput,
                topic: '',
            }),
        );
    });

    it('retrieves all approved facts', async () => {
        const result = await service.listFacts();

        assert.equal(result.length, 1);
        assert.equal(result[0]?.id, 'fact-1');
    });

    it('retrieves facts by topic', async () => {
        let receivedTopic: string | undefined;

        repository.findMany = async (topic?: string) => {
            receivedTopic = topic;
            return [mockFact];
        };

        const result = await service.listFacts('Product');

        assert.equal(receivedTopic, 'Product');
        assert.equal(result.length, 1);
    });

    it('retrieves semantically relevant facts', async () => {
        const vector = Array(768).fill(0.1);

        const result = await service.findRelevantFacts(vector);

        assert.equal(result.length, 1);
        assert.equal(result[0]?.similarity, 0.85);
        assert.equal(result[0]?.validUntil, null);
        assert.equal('embedding' in (result[0] ?? {}), false);
    });

    it('rejects query vectors with invalid dimensions', async () => {
        await assert.rejects(
            service.findRelevantFacts([0.1, 0.2]),
            /768 finite numbers/,
        );
    });

    it('rejects query vectors containing NaN', async () => {
        const vector = Array(768).fill(0.1);
        vector[10] = Number.NaN;

        await assert.rejects(
            service.findRelevantFacts(vector),
            /768 finite numbers/,
        );
    });

    it('rejects invalid retrieval limits', async () => {
        const vector = Array(768).fill(0.1);

        await assert.rejects(
            service.findRelevantFacts(vector, 0),
            /positive integer/,
        );
    });

    it('generates and saves embeddings successfully', async () => {
        const embedding = Array(768).fill(0.25);
        let savedEmbedding: number[] | undefined;

        const generator: FactEmbeddingGenerator = {
            generateEmbedding: async () => embedding,
        };

        repository.updateEmbedding = async (_id, value) => {
            savedEmbedding = value;
            return { ...mockFact, embedding: value };
        };

        const embeddingService = new KnowledgeService(
            repository as unknown as KnowledgeRepository,
            generator,
        );

        const result =
            await embeddingService.generateAndSaveEmbeddings();

        assert.equal(result, 1);
        assert.deepEqual(savedEmbedding, embedding);
    });

    it('returns zero when no facts need embeddings', async () => {
        repository.findFactsWithoutEmbeddings = async () => [];

        const generator: FactEmbeddingGenerator = {
            generateEmbedding: async () => Array(768).fill(0.1),
        };

        const embeddingService = new KnowledgeService(
            repository as unknown as KnowledgeRepository,
            generator,
        );

        const result =
            await embeddingService.generateAndSaveEmbeddings();

        assert.equal(result, 0);
    });

    it('throws when embedding generator is not configured', async () => {
        await assert.rejects(
            service.generateAndSaveEmbeddings(),
            /not configured/,
        );
    });

    it('rejects embeddings with invalid dimensions', async () => {
        const generator: FactEmbeddingGenerator = {
            generateEmbedding: async () => [0.1, 0.2],
        };

        const embeddingService = new KnowledgeService(
            repository as unknown as KnowledgeRepository,
            generator,
        );

        await assert.rejects(
            embeddingService.generateAndSaveEmbeddings(),
            /Invalid embedding/,
        );
    });

    it('propagates embedding provider errors', async () => {
        const generator: FactEmbeddingGenerator = {
            generateEmbedding: async () => {
                throw new Error('AI provider unavailable');
            },
        };

        const embeddingService = new KnowledgeService(
            repository as unknown as KnowledgeRepository,
            generator,
        );

        await assert.rejects(
            embeddingService.generateAndSaveEmbeddings(),
            /AI provider unavailable/,
        );
    });
});
