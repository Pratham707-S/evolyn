import { Router } from 'express';

import type { IDecisionService } from './index.js';
import type { ISubmissionService } from '../submissions/index.js';
import { DecisionsController } from './decisions.controller.js';
import { decisionService } from './decisions.service.js';
import { submissionService } from '../submissions/index.js';

export function createDecisionsRouter(
  service: IDecisionService = decisionService,
  submissions: Pick<ISubmissionService, 'getSubmissionById'> = submissionService
): Router {
  const router = Router();
  const controller = new DecisionsController(service, submissions);

  router.post('/submissions/:id/decision', controller.record);
  router.get('/submissions/:id/decision', controller.getBySubmissionId);
  router.get('/submissions/:id/decisions', controller.getHistoryBySubmissionId);

  return router;
}

export const decisionsRouter = createDecisionsRouter();
export { decisionService };
