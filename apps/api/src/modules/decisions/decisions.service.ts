import {
  decisionTypeSchema,
  submitDecisionSchema,
  uuidSchema,
} from '@evolyn/shared';
import type { Decision, SubmitDecisionInput } from '@evolyn/shared';

import { submissionService } from '../submissions/index.js';
import type { IDecisionService } from './index.js';
import {
  DecisionsRepository,
  decisionsRepository,
  type DecisionIssueRecord,
  type DecisionRecord,
} from './decisions.repository.js';
import {
  DecisionError,
  decisionToSubmissionStatus,
  type DecisionDependencies,
} from './decisions.types.js';

export function mapDecision(record: DecisionRecord): Decision {
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

export class DecisionService implements IDecisionService {
  private readonly inFlightDecisions = new Map<string, Promise<Decision>>();

  constructor(private readonly dependencies: DecisionDependencies) {}

  async recordDecision(input: SubmitDecisionInput): Promise<Decision> {
    const validated = submitDecisionSchema.parse(input);
    const submissionId = uuidSchema.parse(validated.submissionId);

    if (this.inFlightDecisions.has(submissionId)) {
      throw new DecisionError(
        'DECISION_EXISTS',
        'A decision is currently being recorded for this submission'
      );
    }

    const execution = this.executeRecordDecision(validated);
    this.inFlightDecisions.set(submissionId, execution);

    try {
      return await execution;
    } finally {
      this.inFlightDecisions.delete(submissionId);
    }
  }

  private async executeRecordDecision(
    validated: SubmitDecisionInput
  ): Promise<Decision> {
    const submission = await this.dependencies.submissions.getSubmissionById(
      validated.submissionId
    );
    if (!submission) {
      throw new DecisionError(
        'SUBMISSION_NOT_FOUND',
        `Submission not found: ${validated.submissionId}`
      );
    }

    // Check if submission already finalized
    if (submission.status === 'APPROVED' || submission.status === 'REJECTED') {
      throw new DecisionError(
        'DECISION_EXISTS',
        `A final decision has already been recorded for this submission (${submission.status})`
      );
    }

    // Submission must be reviewed before receiving a decision
    if (submission.status !== 'REVIEWED') {
      throw new DecisionError(
        'SUBMISSION_NOT_REVIEWED',
        `Submission cannot receive a decision in ${submission.status} status`
      );
    }

    // Prevent duplicate final decisions
    const existing = await this.dependencies.repository.findBySubmissionId(
      validated.submissionId
    );
    if (
      existing &&
      (existing.decision === 'APPROVED' || existing.decision === 'REJECTED')
    ) {
      throw new DecisionError(
        'DECISION_EXISTS',
        'A decision has already been recorded for this submission'
      );
    }

    const overriddenIssueIds = [...new Set(validated.overriddenIssueIds)];
    const shouldLoadIssues =
      overriddenIssueIds.length > 0 || this.dependencies.insights !== undefined;

    const issues = shouldLoadIssues
      ? await this.dependencies.repository.listIssuesBySubmissionId(
          validated.submissionId
        )
      : [];
    const issueIds = new Set(issues.map((issue) => issue.id));
    const unknownIssueIds = overriddenIssueIds.filter(
      (issueId) => !issueIds.has(issueId)
    );
    if (unknownIssueIds.length > 0) {
      throw new DecisionError(
        'UNKNOWN_OVERRIDE_ISSUE',
        `Override issue(s) do not belong to this submission: ${unknownIssueIds.join(', ')}`
      );
    }

    const overriddenIssueIdSet = new Set(overriddenIssueIds);
    const overriddenIssues = issues.filter((issue) =>
      overriddenIssueIdSet.has(issue.id)
    );

    let created: DecisionRecord | null = null;

    try {
      created = await this.dependencies.repository.create({
        ...validated,
        overriddenIssueIds,
      });

      if (overriddenIssues.length > 0) {
        await this.dependencies.repository.updateIssueStatuses(
          overriddenIssues.map((issue) => issue.id),
          'OVERRIDDEN'
        );
      }

      await this.dependencies.submissions.updateSubmissionStatus(
        validated.submissionId,
        decisionToSubmissionStatus(validated.decision)
      );
    } catch (error) {
      const cleanupErrors: unknown[] = [];

      if (created) {
        try {
          await this.dependencies.repository.deleteById(created.id);
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError);
        }

        if (overriddenIssues.length > 0) {
          try {
            await this.dependencies.repository.restoreIssueStatuses(
              overriddenIssues
            );
          } catch (cleanupError) {
            cleanupErrors.push(cleanupError);
          }
        }
      }

      if (cleanupErrors.length > 0) {
        throw new AggregateError(
          [error, ...cleanupErrors],
          'Decision failed and cleanup did not complete successfully'
        );
      }

      throw error;
    }

    if (!created) {
      throw new Error('Failed to persist decision');
    }

    // Insight aggregation (never fail a valid sign-off on insights error)
    try {
      await this.notifyInsights(issues);
    } catch (error) {
      console.error('[Decisions] Failed to notify insights:', error);
    }

    return mapDecision(created);
  }

  async getDecisionBySubmissionId(
    submissionId: string
  ): Promise<Decision | null> {
    const id = uuidSchema.parse(submissionId);
    const record = await this.dependencies.repository.findBySubmissionId(id);
    return record ? mapDecision(record) : null;
  }

  async getDecisionHistory(submissionId: string): Promise<Decision[]> {
    const id = uuidSchema.parse(submissionId);
    const records = await this.dependencies.repository.listBySubmissionId(
      id,
      'asc'
    );
    return records.map(mapDecision);
  }

  private async notifyInsights(issues: DecisionIssueRecord[]): Promise<void> {
    const insights = this.dependencies.insights;
    if (!insights) {
      return;
    }

    const notifications = new Map<
      string,
      { ruleId: string; sampleExcerpt: string }
    >();

    for (const issue of issues) {
      if (!issue.ruleId) {
        continue;
      }

      notifications.set(`${issue.ruleId}:${issue.flaggedExcerpt}`, {
        ruleId: issue.ruleId,
        sampleExcerpt: issue.flaggedExcerpt,
      });
    }

    const results = await Promise.allSettled(
      [...notifications.values()].map(async ({ ruleId, sampleExcerpt }) =>
        insights.trackViolation(ruleId, sampleExcerpt)
      )
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('[Decisions] Failed to notify insights:', result.reason);
      }
    }
  }
}

export const decisionService: IDecisionService = new DecisionService({
  submissions: submissionService,
  repository: decisionsRepository,
});

export { DecisionsRepository };
