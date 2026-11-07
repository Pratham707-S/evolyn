/**
 * ============================================================================
 * MODULE: Content Submissions (apps/api/src/modules/submissions)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNER : Ayan (Backend Lead)
 * REVIEWER       : Pratham (Project Lead & Architect)
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES & TASKS IN THIS FOLDER:
 * 1. Content Ingestion & Draft Lifecycle:
 *    - Ingest marketing copy, social media posts, blog drafts, and PR announcements.
 *    - Validate input lengths, metadata, channels (BLOG, SOCIAL_MEDIA, PRESS_RELEASE, etc.).
 * 2. Submission State Machine:
 *    - Manage status transitions: DRAFT -> AUDITING -> UNDER_REVIEW -> APPROVED / REJECTED.
 * 3. Review Trigger Integration:
 *    - Trigger asynchronous/synchronous audit runs with the `reviews` module upon submission.
 *
 * GUARDRAILS & CONTRACTS:
 * - Validate all input payloads with `createSubmissionSchema` from `@evolyn/shared`.
 * - Do not mutate review findings or decisions directly inside this module.
 * ============================================================================
 */

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
  updateSubmission?(id: string, input: { rawText?: string; title?: string; status?: SubmissionStatus }): Promise<ContentSubmission>;
}

export { SubmissionService, submissionService } from './submissions.service.js';
export { submissionRepository } from './submissions.repository.js';
export { SubmissionController, submissionController } from './submissions.controller.js';
export * from './submissions.types.js';
