import { createApprovedFactSchema } from '@evolyn/shared';

import type {
    ApprovedFact,
    CreateApprovedFactInput,
} from '@evolyn/shared';

import type { IKnowledgeService } from './index.js';

import {
    KnowledgeRepository,
    knowledgeRepository,
} from './knowledge.repository.js';

import type {
    ApprovedFactRecord,
} from './knowledge.repository.js';

import type {
    FactMatchResult,
} from './knowledge.types.js';

import type { FactEmbeddingGenerator } from './knowledge.types.js';
import { defaultMaintenanceGate } from '../maintenance/maintenance-gate.js';

type KnowledgeRepositoryPort = Pick<
    KnowledgeRepository,
    | 'create'
    | 'findMany'
    | 'findById'
    | 'delete'
    | 'findRelevantFacts'
    | 'findFactsWithoutEmbeddings'
    | 'updateEmbedding'
>;

function mapFact(record: ApprovedFactRecord): ApprovedFact {
    return {
        id: record.id,
        topic: record.topic,
        claimStatement: record.claimStatement,
        approvedProofSource: record.approvedProofSource,
        validUntil: record.validUntil?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
    };
}

export class KnowledgeService implements IKnowledgeService {
    constructor(
        private readonly repository: KnowledgeRepositoryPort,
        private readonly embeddingGenerator?: FactEmbeddingGenerator,
    ) { }

    async createFact(
        input: CreateApprovedFactInput,
    ): Promise<ApprovedFact> {
        const validatedInput = createApprovedFactSchema.parse(input);

        const fact = await this.repository.create(validatedInput);

        return mapFact(fact);
    }

    async listFacts(topic?: string): Promise<ApprovedFact[]> {
        const facts = await this.repository.findMany(topic);

        return facts.map(mapFact);
    }

    async getFactById(id: string): Promise<ApprovedFact | null> {
        if (!id || !id.trim()) {
            throw new Error('Fact ID cannot be empty');
        }

        const fact = await this.repository.findById(id);
        if (!fact) {
            return null;
        }

        return mapFact(fact);
    }

    async deleteFact(id: string): Promise<boolean> {
        if (!id || !id.trim()) {
            throw new Error('Fact ID cannot be empty');
        }

        return await this.repository.delete(id);
    }

    async findRelevantFacts(
        queryVector: number[],
        limit = 10,
    ): Promise<FactMatchResult[]> {
        if (
            !Array.isArray(queryVector) ||
            queryVector.length !== 768 ||
            !queryVector.every(Number.isFinite)
        ) {
            throw new Error(
                'Query embedding must contain exactly 768 finite numbers',
            );
        }

        if (!Number.isInteger(limit) || limit <= 0) {
            throw new Error('Limit must be a positive integer');
        }

        const facts = await this.repository.findRelevantFacts(
            queryVector,
            limit,
        );

        return facts.map((fact) => ({
            ...mapFact(fact),
            similarity: fact.similarity,
        }));
    }

    async generateAndSaveEmbeddings(): Promise<number> {
        return await defaultMaintenanceGate.withSharedLock(async () => {
            if (!this.embeddingGenerator) {
                throw new Error('Embedding generator is not configured');
            }

            const facts = await this.repository.findFactsWithoutEmbeddings();

            let generatedCount = 0;

            for (const fact of facts) {
                const embedding = await this.embeddingGenerator.generateEmbedding(
                    fact.claimStatement,
                );

                if (
                    !Array.isArray(embedding) ||
                    embedding.length !== 768 ||
                    !embedding.every(Number.isFinite)
                ) {
                    throw new Error(
                        `Invalid embedding generated for fact: ${fact.id}`,
                    );
                }

                await this.repository.updateEmbedding(fact.id, embedding);
                generatedCount++;
            }

            return generatedCount;
        });
    }
}
export const knowledgeService = new KnowledgeService(
    knowledgeRepository,
);