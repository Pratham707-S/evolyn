import { Router } from 'express';
import { SubmissionController } from './submissions.controller.js';

export const submissionsRouter = Router();
const controller = new SubmissionController();

submissionsRouter.post('/', controller.create);
submissionsRouter.get('/', controller.list);
submissionsRouter.get('/:id', controller.getById);
