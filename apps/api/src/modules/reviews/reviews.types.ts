import type {
  DetectedIssue,
  ReviewRun,
} from '@evolyn/shared';
import type { AIProvider } from '../../infrastructure/ai/index.js';
import type { IFindingsService } from '../findings/index.js';
import type { IGuidelineService } from '../guidelines/index.js';
import type { IKnowledgeService } from '../knowledge/index.js';
import type { ISubmissionService } from '../submissions/index.js';

export interface ReviewExecutionResult {
  reviewRun: ReviewRun;
  issues: DetectedIssue[];
}

export interface ReviewDependencies {
  submissions: Pick<ISubmissionService, 'getSubmissionById' | 'updateSubmissionStatus'>;
  guidelines: Pick<IGuidelineService, 'getGuidelines' | 'getGuidelineById'>;
  knowledge: Pick<IKnowledgeService, 'findRelevantFacts'>;
  findings: Pick<IFindingsService, 'recordFindings' | 'getFindingsByReviewRunId'>;
  ai: Pick<AIProvider, 'generateEmbedding' | 'auditContent'>;
}
