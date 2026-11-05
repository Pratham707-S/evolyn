import { uuidSchema } from '@evolyn/shared';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { IFindingsService } from './index.js';
import { findingsService } from './findings.service.js';

const findingsParamsSchema = z.object({
  reviewRunId: uuidSchema,
});

export class FindingsController {
  constructor(private readonly service: IFindingsService = findingsService) {}

  listByReviewRunId = async (
    req: Request<{ reviewRunId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { reviewRunId } = findingsParamsSchema.parse(req.params);
      const findings = await this.service.getFindingsByReviewRunId(reviewRunId);
      if (findings === null) {
        res.status(404).json({ error: 'Review run not found' });
        return;
      }
      res.status(200).json({ reviewRunId, findings, total: findings.length });
    } catch (error) {
      next(error);
    }
  };
}

export const findingsController = new FindingsController(findingsService);
