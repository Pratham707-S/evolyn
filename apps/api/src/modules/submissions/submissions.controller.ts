import {
  submissionChannelSchema,
  submissionStatusSchema,
} from '@evolyn/shared';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { SubmissionService } from './submissions.service.js';

const listSubmissionsQuerySchema = z.object({
  status: submissionStatusSchema.optional(),
  channel: submissionChannelSchema.optional(),
});

export class SubmissionController {
  constructor(private readonly service = new SubmissionService()) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const submission = await this.service.createSubmission(req.body);
      res.status(201).json({ submission });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = listSubmissionsQuerySchema.parse(req.query);
      const submissions = await this.service.listSubmissions(filter);
      res.status(200).json({ submissions, total: submissions.length });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const submission = await this.service.getSubmissionById(req.params.id);
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      res.status(200).json({ submission });
    } catch (error) {
      next(error);
    }
  };
}
