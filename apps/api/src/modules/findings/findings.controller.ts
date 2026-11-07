import { uuidSchema } from '@evolyn/shared';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { IFindingsService } from './index.js';
import { findingsService } from './findings.service.js';

const findingsParamsSchema = z.object({
  reviewRunId: uuidSchema,
});

const patchFindingSchema = z.object({
  findingId: uuidSchema,
});

const patchStatusBodySchema = z.object({
  status: z.enum(['OPEN', 'ACCEPTED', 'OVERRIDDEN']),
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

  updateStatus = async (
    req: Request<{ reviewRunId: string; findingId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { findingId } = patchFindingSchema.parse(req.params);
      const { status } = patchStatusBodySchema.parse(req.body);

      if (!this.service.updateFindingStatus) {
        res.status(501).json({ error: 'Finding status update not implemented on service' });
        return;
      }

      const updated = await this.service.updateFindingStatus(findingId, status);
      if (!updated) {
        res.status(404).json({ error: 'Finding not found' });
        return;
      }

      res.status(200).json({ finding: updated });
    } catch (error) {
      next(error);
    }
  };
}

export const findingsController = new FindingsController(findingsService);
