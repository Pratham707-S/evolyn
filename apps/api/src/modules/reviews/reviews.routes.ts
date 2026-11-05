import { Router } from 'express';
import type { ISubmissionService } from '../submissions/index.js';
import type { IReviewService } from './index.js';
import { ReviewsController } from './reviews.controller.js';

export function createReviewsRouter(
  reviews: IReviewService,
  submissions: Pick<ISubmissionService, 'getSubmissionById'>
) {
  const router = Router();
  const controller = new ReviewsController(reviews, submissions);

  router.post('/submissions/:id/analyze', controller.analyze);
  router.get('/submissions/:id/review', controller.getBySubmissionId);

  return router;
}
