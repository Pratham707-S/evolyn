/**
 * ============================================================================
 * FEATURE: Content Submission Studio (apps/web/src/features/submissions)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNER        : Pratham Kave (Frontend Lead)
 * BACKEND COUNTERPART   : Ayan (Backend Lead)
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES & TASKS IN THIS FOLDER:
 * 1. Content Submission Studio Form:
 *    - Rich/raw textarea for marketing copy, blog posts, press releases, social drafts.
 *    - Live word counter, character counter, and estimated reading time.
 * 2. Channel & Submitter Selector:
 *    - Channel selection (BLOG, SOCIAL_MEDIA, PRESS_RELEASE, EMAIL_MARKETING, WEBSITE_COPY).
 * 3. Pre-flight Validation & Submission:
 *    - Client-side validation using `@evolyn/shared` `createSubmissionSchema`.
 *    - Seamless transition to review workbench upon audit creation.
 *
 * API INTEGRATION POINTS:
 * - POST /api/submissions (Create & Trigger Audit)
 * - GET  /api/submissions (List Past Submissions)
 * - GET  /api/submissions/:id (Detail & Audit Status)
 * ============================================================================
 */

import type { ContentSubmission, SubmissionChannel } from '@evolyn/shared';

export interface SubmissionFormState {
  title: string;
  channel: SubmissionChannel;
  rawText: string;
  submittedBy: string;
}

export type { ContentSubmission };

export * from './components';
export type { SubmissionData } from './components/submission-preview-modal';
