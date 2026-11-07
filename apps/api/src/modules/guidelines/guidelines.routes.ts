import { Router } from 'express';
import { guidelinesController } from './guidelines.controller.js';

export const guidelinesRouter = Router();

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
