import { Router } from 'express';
import { findingsController } from './findings.controller.js';

export const findingsRouter = Router();

findingsRouter.get('/:reviewRunId/findings', findingsController.listByReviewRunId);
findingsRouter.patch('/:reviewRunId/findings/:findingId', findingsController.updateStatus);
