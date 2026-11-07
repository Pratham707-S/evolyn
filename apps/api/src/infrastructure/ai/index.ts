import type { RewriteAction } from '@evolyn/shared';

/**
 * AI Provider Abstraction Interface
 * Keeps Gemini API integration isolated behind a clean contract
 */
export interface AIEmbeddingOptions {
  dimensions?: number;
}

export interface AIRewriteOptions {
  maxOutputTokens?: number;
  temperature?: number;
}

export interface AIRewriteParams {
  action: RewriteAction;
  content: string;
  instructions?: string;
  rules?: Array<{ id: string; statement: string; severity: string }>;
  facts?: Array<{ id: string; claim: string; source: string }>;
  options?: AIRewriteOptions;
}

export interface AIRewriteResult {
  rewrittenText: string;
  rationale: string;
}

export interface AIProvider {
  /**
   * Generates a 768-dimensional vector embedding for semantic search
   */
  generateEmbedding(text: string, options?: AIEmbeddingOptions): Promise<number[]>;

  /**
   * Evaluates content against candidate rules and facts with strict schema enforcement
   */
  auditContent(params: {
    content: string;
    rules: Array<{ id: string; statement: string; severity: string }>;
    facts: Array<{ id: string; claim: string; source: string }>;
  }): Promise<{
    issues: Array<{
      ruleId?: string;
      factId?: string;
      issueType: string;
      flaggedExcerpt: string;
      explanation: string;
      suggestedFix: string;
      sourceQuote: string;
      confidenceScore: number;
      evidenceStrengthScore: number;
    }>;
  }>;

  /**
   * Rewrites content according to a specified action, adhering to brand guidelines and verified facts
   */
  rewriteContent(params: AIRewriteParams): Promise<AIRewriteResult>;
}

export {
  BrandGovernanceAIProvider,
  BrandGovernanceAIConfigError,
  type BrandGovernanceContext,
  type BrandGovernanceEvaluateParams,
} from './brand-governance.provider.js';
