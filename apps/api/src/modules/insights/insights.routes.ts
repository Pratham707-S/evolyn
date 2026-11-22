import { Router } from 'express';
import { insightsController } from './insights.controller.js';

export const insightsRouter = Router();

insightsRouter.get('/recurring-mistakes', insightsController.listMistakes);
insightsRouter.get('/analytics', insightsController.getAnalytics);
insightsRouter.post('/refine/:ruleId', insightsController.refineRule);
insightsRouter.post('/apply/:ruleId', insightsController.applyRefinement);
insightsRouter.post('/dismiss/:ruleId', insightsController.dismissMistake);
insightsRouter.post('/seed-demo', insightsController.seedDemo);
