import type { ContentSubmission, SubmissionChannel } from '@evolyn/shared';

export interface SubmissionFormState {
  title: string;
  channel: SubmissionChannel;
  rawText: string;
  submittedBy: string;
}

export type { ContentSubmission };
