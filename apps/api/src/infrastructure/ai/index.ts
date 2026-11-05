/**
 * AI Provider Abstraction Interface
 * Keeps Gemini API integration isolated behind a clean contract
 */
export interface AIEmbeddingOptions {
  dimensions?: number;
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
      ruleId?: string | null;
      factId?: string | null;
      issueType: string;
      flaggedExcerpt: string;
      explanation: string;
      suggestedFix: string;
      sourceQuote: string;
      confidenceScore: number;
      evidenceStrengthScore: number;
    }>;
  }>;
}
