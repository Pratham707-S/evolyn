import {
  createSubmissionSchema,
  decisionTypeSchema,
  submissionChannelSchema,
  submissionStatusSchema,
  uuidSchema,
} from '@evolyn/shared';
import type {
  ContentSubmission,
  Decision,
  ReviewRun,
  SubmissionChannel,
  SubmissionStatus,
} from '@evolyn/shared';
import { z } from 'zod';
import type { ISubmissionService } from './index.js';
import {
  SubmissionRepository,
  submissionRepository,
  type DecisionRecord,
  type ReviewRunRecord,
  type SubmissionDetailsRecord,
  type SubmissionRecord,
} from './submissions.repository.js';
import type { SubmissionWithReview } from './submissions.types.js';

const reviewSummarySchema = z.object({
  passedChecksCount: z.number(),
  failedChecksCount: z.number(),
  notes: z.string().optional(),
});

function mapSubmission(record: SubmissionRecord): ContentSubmission {
  return {
    id: record.id,
    title: record.title,
    channel: submissionChannelSchema.parse(record.channel),
    rawText: record.rawText,
    fileUrl: record.fileUrl,
    submittedBy: record.submittedBy,
    status: submissionStatusSchema.parse(record.status),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapReviewRun(record: ReviewRunRecord): ReviewRun {
  const summary = reviewSummarySchema.safeParse(record.summary);
  if (!summary.success) {
    throw new Error(`Review run ${record.id} has an invalid summary`);
  }

  return {
    id: record.id,
    submissionId: record.submissionId,
    overallComplianceScore: record.overallComplianceScore,
    totalIssuesCount: record.totalIssuesCount,
    modelUsed: record.modelUsed,
    summary: summary.data,
    createdAt: record.createdAt.toISOString(),
  };
}

function mapDecision(record: DecisionRecord): Decision {
  if (
    !Array.isArray(record.overriddenIssueIds) ||
    !record.overriddenIssueIds.every((id) => typeof id === 'string')
  ) {
    throw new Error(`Decision ${record.id} has invalid overridden issue IDs`);
  }

  return {
    id: record.id,
    submissionId: record.submissionId,
    decision: decisionTypeSchema.parse(record.decision),
    reviewerName: record.reviewerName,
    comments: record.comments,
    overriddenIssueIds: record.overriddenIssueIds,
    createdAt: record.createdAt.toISOString(),
  };
}

function mapSubmissionDetails(record: SubmissionDetailsRecord): SubmissionWithReview {
  return {
    ...mapSubmission(record.submission),
    reviewRun: record.reviewRun ? mapReviewRun(record.reviewRun) : null,
    decision: record.decision ? mapDecision(record.decision) : null,
  };
}

export class SubmissionService implements ISubmissionService {
  constructor(
    private readonly repository: Pick<
      SubmissionRepository,
      'create' | 'findById' | 'list' | 'updateStatus'
    > & { update?: SubmissionRepository['update'] } = submissionRepository
  ) {}

  async createSubmission(input: unknown): Promise<ContentSubmission> {
    const submission = createSubmissionSchema.parse(input);
    return mapSubmission(await this.repository.create(submission));
  }

  async getSubmissionById(id: string): Promise<SubmissionWithReview | null> {
    const submissionId = uuidSchema.parse(id);
    const record = await this.repository.findById(submissionId);
    return record ? mapSubmissionDetails(record) : null;
  }

  async listSubmissions(filter: {
    status?: SubmissionStatus | string;
    channel?: SubmissionChannel | string;
  } = {}): Promise<ContentSubmission[]> {
    const validatedFilter = {
      ...(filter.status === undefined
        ? {}
        : { status: submissionStatusSchema.parse(filter.status) }),
      ...(filter.channel === undefined
        ? {}
        : { channel: submissionChannelSchema.parse(filter.channel) }),
    };

    const records = await this.repository.list(validatedFilter);
    return records.map(mapSubmission);
  }

  async updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<void> {
    const submissionId = uuidSchema.parse(id);
    const validatedStatus = submissionStatusSchema.parse(status);
    await this.repository.updateStatus(submissionId, validatedStatus);
  }

  async updateSubmission(
    id: string,
    input: { rawText?: string; title?: string; status?: SubmissionStatus }
  ): Promise<ContentSubmission> {
    const submissionId = uuidSchema.parse(id);
    const validatedStatus = input.status ? submissionStatusSchema.parse(input.status) : undefined;
    const validatedText = input.rawText !== undefined ? input.rawText.trim() : undefined;
    if (validatedText !== undefined && validatedText.length < 5) {
      throw new Error('Revised content must be at least 5 characters');
    }
    const updatePayload: { rawText?: string; title?: string; status?: SubmissionStatus } = {};
    if (validatedText !== undefined) updatePayload.rawText = validatedText;
    if (input.title?.trim()) updatePayload.title = input.title.trim();
    if (validatedStatus) updatePayload.status = validatedStatus;

    if (!this.repository.update) {
      throw new Error('Repository does not support update');
    }
    const record = await this.repository.update(submissionId, updatePayload);
    return mapSubmission(record);
  }
}

export const submissionService = new SubmissionService(submissionRepository);
