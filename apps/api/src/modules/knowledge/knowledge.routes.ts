import { Router } from 'express';

import { knowledgeController } from './knowledge.controller.js';

export const knowledgeRouter = Router();

knowledgeRouter.post(
    '/facts',
    knowledgeController.createFact,
);

knowledgeRouter.get(
    '/facts',
    knowledgeController.getFacts,
);
