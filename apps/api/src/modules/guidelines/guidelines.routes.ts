import { Router } from 'express';
import { guidelinesController } from './guidelines.controller.js';

export const guidelinesRouter = Router();

guidelinesRouter.get(
    '/conflicts',
    guidelinesController.getAllConflicts,
);

guidelinesRouter.post(
    '/detect-all-conflicts',
    guidelinesController.detectAllConflicts,
);

guidelinesRouter.post(
    '/conflicts/seed-sample',
    guidelinesController.seedSampleConflict,
);

guidelinesRouter.patch(
    '/conflicts/:conflictId',
    guidelinesController.resolveConflict,
);

guidelinesRouter.post(
    '/',
    guidelinesController.createGuideline,
);

guidelinesRouter.get(
    '/',
    guidelinesController.getGuidelines,
);

guidelinesRouter.get(
    '/:id',
    guidelinesController.getGuidelineById,
);

guidelinesRouter.put(
    '/:id',
    guidelinesController.updateGuideline,
);

guidelinesRouter.delete(
    '/:id',
    guidelinesController.deleteGuideline,
);

guidelinesRouter.post(
    '/:id/extract-rules',
    guidelinesController.extractRules,
);

guidelinesRouter.post(
    '/:id/detect-conflicts',
    guidelinesController.detectConflicts,
);
