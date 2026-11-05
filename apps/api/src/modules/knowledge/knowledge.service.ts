import { createApprovedFactSchema } from '@evolyn/shared';
import type { ApprovedFact, CreateApprovedFactInput } from '@evolyn/shared';
import type { AIProvider } from '../../infrastructure/ai/index.js';
import { GeminiAIProvider } from '../../infrastructure/ai/gemini.provider.js';
import {
  KnowledgeRepository,
  type ApprovedFactRecord,
} from './knowledge.repository.js';
import type { FactMatchResult } from './knowledge.types.js';
import type { IKnowledgeService } from './index.js';

const EMBEDDING_DIMENSIONS = 768;

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
    private readonly repository: Pick<KnowledgeRepository, 'create' | 'list' | 'findRelevant'> =
      new KnowledgeRepository(),
    private readonly ai: Pick<AIProvider, 'generateEmbedding'> = new GeminiAIProvider()
  ) {}

  async createFact(input: CreateApprovedFactInput): Promise<ApprovedFact> {
    const validated = createApprovedFactSchema.parse(input);
    const validUntil = validated.validUntil ? new Date(validated.validUntil) : null;
    if (validUntil && !Number.isFinite(validUntil.getTime())) {
      throw new Error('Approved fact validUntil must be a valid ISO date');
    }

    const embedding = await this.ai.generateEmbedding(validated.claimStatement, {
      dimensions: EMBEDDING_DIMENSIONS,
    });
    this.validateEmbedding(embedding);

    const record = await this.repository.create({
      topic: validated.topic,
      claimStatement: validated.claimStatement,
      approvedProofSource: validated.approvedProofSource,
      validUntil,
      embedding,
    });

    return mapFact(record);
  }

  async listFacts(topic?: string): Promise<ApprovedFact[]> {
    const records = await this.repository.list(topic);
    return records.map(mapFact);
  }

  async findRelevantFacts(
    queryVector: number[],
    limit = 5
  ): Promise<FactMatchResult[]> {
    this.validateEmbedding(queryVector);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('Fact search limit must be an integer between 1 and 100');
    }

    const records = await this.repository.findRelevant(queryVector, limit);
    return records.map(({ similarity, ...record }) => ({
      ...mapFact(record),
      similarity,
    }));
  }

  private validateEmbedding(embedding: number[]): void {
    if (
      embedding.length !== EMBEDDING_DIMENSIONS ||
      !embedding.every((value) => Number.isFinite(value))
    ) {
      throw new Error(`Embeddings must contain ${EMBEDDING_DIMENSIONS} finite values`);
    }
  }
}
