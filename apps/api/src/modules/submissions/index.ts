import type { ContentSubmission, CreateSubmissionInput, SubmissionStatus } from '@evolyn/shared';
import type { SubmissionWithReview } from './submissions.types.js';

export interface ISubmissionService {
  createSubmission(input: CreateSubmissionInput): Promise<ContentSubmission>;
  getSubmissionById(id: string): Promise<SubmissionWithReview | null>;
  listSubmissions(filter?: { status?: string; channel?: string }): Promise<ContentSubmission[]>;
  updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<void>;
}

export * from './submissions.types.js';
