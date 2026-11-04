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
