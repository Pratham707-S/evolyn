import type {
  DetectedIssue,
  GuidelineRule,
  ReviewRun,
} from '@evolyn/shared';
import type {
  AIProvider,
  AIRewriteParams,
  AIRewriteResult,
} from '../../infrastructure/ai/index.js';
import type { IFindingsService } from '../findings/index.js';
import type { IKnowledgeService } from '../knowledge/index.js';
import type { ISubmissionService } from '../submissions/index.js';

export interface ReviewExecutionResult {
  reviewRun: ReviewRun;
  issues: DetectedIssue[];
}

export interface ReviewExecutionOptions {
  content?: string;
  force?: boolean;
  requestId?: string;
}

export interface ReviewDependencies {
  submissions: Pick<ISubmissionService, 'getSubmissionById' | 'updateSubmissionStatus'>;
  guidelines: {
    findSimilarRules?(queryVector: number[], limit?: number): Promise<GuidelineRule[]>;
    findRelevantRules?(queryVector: number[], limit?: number): Promise<GuidelineRule[]>;
  };
  knowledge: Pick<IKnowledgeService, 'findRelevantFacts'>;
  findings: Pick<IFindingsService, 'recordFindings' | 'getFindingsByReviewRunId'>;
  ai: Pick<AIProvider, 'generateEmbedding' | 'auditContent'> & {
    rewriteContent?(params: AIRewriteParams): Promise<AIRewriteResult>;
  };
}
