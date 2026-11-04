import { uuidSchema } from '@evolyn/shared';
import type { NextFunction, Request, Response } from 'express';
import { FindingsService } from './findings.service.js';

export class FindingsController {
  constructor(private readonly service = new FindingsService()) {}

  listByReviewRunId = async (
    req: Request<{ reviewRunId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const reviewRunId = uuidSchema.parse(req.params.reviewRunId);
      const findings = await this.service.getFindingsByReviewRunId(reviewRunId);
      res.status(200).json({ reviewRunId, findings, total: findings.length });
    } catch (error) {
      next(error);
    }
  };
}
