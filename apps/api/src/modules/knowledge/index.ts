/**
 * ============================================================================
 * MODULE: Approved Facts & Knowledge Repository (apps/api/src/modules/knowledge)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNER : Mann (Guideline Knowledge Engineer)
 * REVIEWER       : Pratham (Project Lead & Architect)
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES & TASKS IN THIS FOLDER:
 * 1. Approved Facts Repository:
 *    - Store company-verified factual claims (financial figures, metrics, launch dates, uptime).
 *    - Ensure every approved fact has an authentic, verified proof source URL or citation.
 * 2. Fact Vectorization & Retrieval:
 *    - Generate 768-dim embeddings for fact statements.
 *    - Provide vector similarity search (`findRelevantFacts`) to match claims in submitted copy.
 * 3. Innovation 2 Support — Fact Verification:
 *    - Supply the reference truths used by the Claim Evidence Strength Engine.
 *
 * GUARDRAILS & CONTRACTS:
 * - Reject any fact creation attempt if proofSource is empty or invalid.
 * - Consume shared types from `@evolyn/shared`.
 * ============================================================================
 */

import type { ApprovedFact, CreateApprovedFactInput } from '@evolyn/shared';
import type { FactMatchResult } from './knowledge.types.js';

export interface IKnowledgeService {
  createFact(input: CreateApprovedFactInput): Promise<ApprovedFact>;
  listFacts(topic?: string): Promise<ApprovedFact[]>;
  findRelevantFacts(queryVector: number[], limit?: number): Promise<FactMatchResult[]>;
  generateAndSaveEmbeddings(): Promise<number>;
}

export * from './knowledge.types.js';
export * from './knowledge.service.js';
