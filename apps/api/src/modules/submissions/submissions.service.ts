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
import type { ISubmissionService } from './index.js';
import {
  SubmissionRepository,
  type DecisionRecord,
  type ReviewRunRecord,
  type SubmissionDetailsRecord,
  type SubmissionRecord,
} from './submissions.repository.js';
import type { SubmissionWithReview } from './submissions.types.js';

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
  const summary = record.summary;
  if (
    typeof summary !== 'object' ||
    summary === null ||
    typeof summary.passedChecksCount !== 'number' ||
    typeof summary.failedChecksCount !== 'number' ||
    (summary.notes !== undefined && typeof summary.notes !== 'string')
  ) {
    throw new Error(`Review run ${record.id} has an invalid summary`);
  }

  return {
    id: record.id,
    submissionId: record.submissionId,
    overallComplianceScore: record.overallComplianceScore,
    totalIssuesCount: record.totalIssuesCount,
    modelUsed: record.modelUsed,
    summary: {
      passedChecksCount: summary.passedChecksCount,
      failedChecksCount: summary.failedChecksCount,
      ...(summary.notes === undefined ? {} : { notes: summary.notes }),
    },
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
    > = new SubmissionRepository()
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
}
