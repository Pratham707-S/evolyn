import { uuidSchema } from '@evolyn/shared';
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
      const result = await this.reviews.executeReview(submissionId);
      res.status(200).json({
        reviewRunId: result.reviewRun.id,
        submissionId: result.reviewRun.submissionId,
        overallComplianceScore: result.reviewRun.overallComplianceScore,
        totalIssuesCount: result.reviewRun.totalIssuesCount,
        summary: result.reviewRun.summary,
        issues: result.issues,
      });
    } catch (error) {
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
}
