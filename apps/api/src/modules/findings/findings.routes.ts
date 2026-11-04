import { Router } from 'express';
import { FindingsController } from './findings.controller.js';

export const findingsRouter = Router();
const controller = new FindingsController();

findingsRouter.get('/:reviewRunId/findings', controller.listByReviewRunId);
