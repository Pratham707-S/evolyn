import { Router } from 'express';

import { knowledgeController } from './knowledge.controller.js';

export const knowledgeRouter = Router();

knowledgeRouter.post(
    '/verify-claim',
    knowledgeController.verifyClaim,
);

knowledgeRouter.post(
    '/facts/seed-samples',
    knowledgeController.seedSamples,
);

knowledgeRouter.post(
    '/facts',
    knowledgeController.createFact,
);

knowledgeRouter.get(
    '/facts',
    knowledgeController.getFacts,
);

knowledgeRouter.get(
    '/facts/:id',
    knowledgeController.getFactById,
);

knowledgeRouter.delete(
    '/facts/:id',
    knowledgeController.deleteFact,
);
