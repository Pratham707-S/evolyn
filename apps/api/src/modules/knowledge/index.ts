import type { ApprovedFact, CreateApprovedFactInput } from '@evolyn/shared';
import type { FactMatchResult } from './knowledge.types.js';

export interface IKnowledgeService {
  createFact(input: CreateApprovedFactInput): Promise<ApprovedFact>;
  listFacts(topic?: string): Promise<ApprovedFact[]>;
  findRelevantFacts(queryVector: number[], limit?: number): Promise<FactMatchResult[]>;
}

export * from './knowledge.types.js';
