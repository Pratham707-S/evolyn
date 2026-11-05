/**
 * ============================================================================
 * MODULE: Guidelines Knowledge Hub (apps/api/src/modules/guidelines)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNER : Mann (Guideline Knowledge Engineer)
 * REVIEWER       : Pratham (Project Lead & Architect)
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES & TASKS IN THIS FOLDER:
 * 1. Brand Guideline Ingestion:
 *    - Ingest brand guidelines via raw text editor and PDF file uploads.
 * 2. Rule Extraction & Embedding Generation:
 *    - Extract atomic, verifiable rules (MANDATORY, PROHIBITED, CONDITIONAL, RECOMMENDED).
 *    - Generate 768-dimensional vector embeddings for each rule via Gemini API (text-embedding-004).
 * 3. Semantic Storage:
 *    - Persist guidelines and rule embeddings into PostgreSQL with pgvector.
 * 4. Innovation 1 — Conflict & Ambiguity Detector:
 *    - Perform pairwise cross-rule semantic similarity checks to flag contradictory rules.
 *
 * GUARDRAILS & CONTRACTS:
 * - Always import types and schemas from `@evolyn/shared`.
 * - Do NOT access frontend files or write Express routes outside of guidelines module.
 * ============================================================================
 */

import type {
  Guideline,
  GuidelineRule,
  CreateGuidelineInput,
} from '@evolyn/shared';

import type { GuidelineQueryFilter } from './guidelines.types.js';
import type { GuidelineConflictRecord } from './guidelines.repository.js';

export interface GuidelineWithRules extends Guideline {
  rules: GuidelineRule[];
}

export interface IGuidelineService {
  createGuideline(input: CreateGuidelineInput): Promise<Guideline>;
  getGuidelines(filter?: GuidelineQueryFilter): Promise<Guideline[]>;
  getGuidelineById(id: string): Promise<GuidelineWithRules | null>;

  detectAndSaveConflicts(
    guidelineId: string,
  ): Promise<GuidelineConflictRecord[]>;
}

// Module boundary re-exports
export * from './guidelines.types.js';
export * from './conflict-detector.js';
