import { rewriteContentSchema, uuidSchema } from '@evolyn/shared';
import type { NextFunction, Request, Response } from 'express';
import type { ISubmissionService } from '../submissions/index.js';
import type { IReviewService } from './index.js';

export class ReviewsController {
  constructor(
    private readonly reviews: IReviewService,
    private readonly submissions: Pick<ISubmissionService, 'getSubmissionById'>
  ) {}

  analyze = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const submissionId = uuidSchema.parse(req.params.id);
      const content =
        typeof req.body?.content === 'string' && req.body.content.trim().length > 0
          ? req.body.content.trim()
          : undefined;
      const result = await this.reviews.executeReview(submissionId, { content });
      res.status(200).json({
        reviewRunId: result.reviewRun.id,
        submissionId: result.reviewRun.submissionId,
        overallComplianceScore: result.reviewRun.overallComplianceScore,
        totalIssuesCount: result.reviewRun.totalIssuesCount,
        summary: result.reviewRun.summary,
        issues: result.issues,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Submission not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (
        error instanceof Error &&
        error.message.includes('cannot be analyzed in status')
      ) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  };

  getBySubmissionId = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const submissionId = uuidSchema.parse(req.params.id);
      const [submission, result] = await Promise.all([
        this.submissions.getSubmissionById(submissionId),
        this.reviews.getReviewBySubmissionId(submissionId),
      ]);

      if (!submission || !result) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }

      res.status(200).json({
        submission,
        reviewRun: result.reviewRun,
        issues: result.issues,
        decision: submission.decision ?? null,
      });
    } catch (error) {
      next(error);
    }
  };

  getHistoryBySubmissionId = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const submissionId = uuidSchema.parse(req.params.id);
      const submission = await this.submissions.getSubmissionById(submissionId);
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      const reviews = this.reviews.getReviewHistory
        ? await this.reviews.getReviewHistory(submissionId)
        : [];

      res.status(200).json({
        submissionId,
        reviews,
        total: reviews.length,
      });
    } catch (error) {
      next(error);
    }
  };

  rewrite = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const submissionId = uuidSchema.parse(req.params.id);
      const input = rewriteContentSchema.parse(req.body);
      if (!this.reviews.rewrite) {
        throw new Error('Review service does not support rewrite');
      }

      const result = await this.reviews.rewrite(submissionId, input);
      res.status(200).json(result);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'Submission not found' ||
          error.message.startsWith('Submission not found:'))
      ) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }
      next(error);
    }
  };
}
