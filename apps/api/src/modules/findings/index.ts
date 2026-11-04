import type { DetectedIssue } from '@evolyn/shared';
import type { RawFindingInput } from './findings.types.js';

export interface IFindingsService {
  recordFindings(reviewRunId: string, rawFindings: RawFindingInput[]): Promise<DetectedIssue[]>;
  verifyVerbatimQuote(quote: string, sourceText: string): boolean;
  getFindingsByReviewRunId(reviewRunId: string): Promise<DetectedIssue[]>;
}

export * from './findings.types.js';
