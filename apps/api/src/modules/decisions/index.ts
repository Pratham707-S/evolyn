import type { Decision, SubmitDecisionInput } from '@evolyn/shared';

export interface IDecisionService {
  recordDecision(input: SubmitDecisionInput): Promise<Decision>;
  getDecisionBySubmissionId(submissionId: string): Promise<Decision | null>;
}

export * from './decisions.types.js';
