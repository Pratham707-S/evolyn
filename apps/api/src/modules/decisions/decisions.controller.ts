import { submitDecisionSchema, uuidSchema } from '@evolyn/shared';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import type { ISubmissionService } from '../submissions/index.js';
import { submissionService } from '../submissions/index.js';
import type { IDecisionService } from './index.js';
import { decisionService } from './decisions.service.js';
import {
  DecisionError,
  decisionToSubmissionStatus,
  type DecisionErrorCode,
} from './decisions.types.js';

const submissionParamsSchema = z.object({
  id: uuidSchema,
});

const httpStatusByErrorCode: Record<DecisionErrorCode, number> = {
  SUBMISSION_NOT_FOUND: 404,
  SUBMISSION_NOT_REVIEWED: 400,
  DECISION_EXISTS: 409,
  UNKNOWN_OVERRIDE_ISSUE: 400,
  SUBMISSION_ID_MISMATCH: 400,
};

function sendDecisionError(
  error: unknown,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof DecisionError) {
    res.status(httpStatusByErrorCode[error.code]).json({ error: error.message });
    return;
  }

  next(error);
}

export class DecisionsController {
  constructor(
    private readonly service: IDecisionService = decisionService,
    private readonly submissions: Pick<ISubmissionService, 'getSubmissionById'> = submissionService
  ) {}

  record = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = submissionParamsSchema.parse(req.params);
      const body = (req.body ?? {}) as Record<string, unknown>;

      if (body.submissionId !== undefined && body.submissionId !== id) {
        throw new DecisionError(
          'SUBMISSION_ID_MISMATCH',
          'Body submissionId does not match the submission in the URL'
        );
      }

      const input = submitDecisionSchema.parse({ ...body, submissionId: id });
      const decision = await this.service.recordDecision(input);

      res.status(201).json({
        decision,
        updatedSubmissionStatus: decisionToSubmissionStatus(decision.decision),
      });
    } catch (error) {
      sendDecisionError(error, res, next);
    }
  };

  getBySubmissionId = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = submissionParamsSchema.parse(req.params);
      const decision = await this.service.getDecisionBySubmissionId(id);

      if (!decision) {
        res.status(404).json({ error: 'Decision not found' });
        return;
      }

      res.status(200).json({ decision });
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
      const { id } = submissionParamsSchema.parse(req.params);
      const submission = await this.submissions.getSubmissionById(id);

      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      const decisions = this.service.getDecisionHistory
        ? await this.service.getDecisionHistory(id)
        : [];

      res.status(200).json({
        submissionId: id,
        decisions,
        total: decisions.length,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const decisionsController = new DecisionsController(
  decisionService,
  submissionService
);
