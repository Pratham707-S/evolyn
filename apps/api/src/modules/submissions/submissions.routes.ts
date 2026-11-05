import { Router } from 'express';
import { submissionController } from './submissions.controller.js';

export const submissionsRouter = Router();

submissionsRouter.post('/', submissionController.create);
submissionsRouter.get('/', submissionController.list);
submissionsRouter.get('/:id', submissionController.getById);
