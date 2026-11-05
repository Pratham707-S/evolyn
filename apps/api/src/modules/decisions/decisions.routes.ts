import { Router } from 'express';

import type { IDecisionService } from './index.js';
import { DecisionsController } from './decisions.controller.js';
import { decisionService } from './decisions.service.js';

export function createDecisionsRouter(
  service: IDecisionService = decisionService
): Router {
  const router = Router();
  const controller = new DecisionsController(service);

  router.post('/submissions/:id/decision', controller.record);
  router.get('/submissions/:id/decision', controller.getBySubmissionId);

  return router;
}

export const decisionsRouter = createDecisionsRouter();
