import type {
  ContentSubmission,
  CreateSubmissionInput,
  SubmissionChannel,
  SubmissionStatus,
} from '@evolyn/shared';
import type { SubmissionWithReview } from './submissions.types.js';

export interface ISubmissionService {
  createSubmission(input: CreateSubmissionInput): Promise<ContentSubmission>;
  getSubmissionById(id: string): Promise<SubmissionWithReview | null>;
  listSubmissions(filter?: { status?: SubmissionStatus; channel?: SubmissionChannel }): Promise<ContentSubmission[]>;
  updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<void>;
}

export { SubmissionService } from './submissions.service.js';
export * from './submissions.types.js';
