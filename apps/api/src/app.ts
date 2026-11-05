import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { guidelinesRouter } from './modules/guidelines/guidelines.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { submissionsRouter } from './modules/submissions/submissions.routes.js';
import { findingsRouter } from './modules/findings/findings.routes.js';
import { knowledgeRouter } from './modules/knowledge/knowledge.routes.js';
import { reviewsRouter } from './modules/reviews/reviews.routes.js';
import { decisionsRouter } from './modules/decisions/decisions.routes.js';

export const app = express();

// Global Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root Route
app.get('/', (req, res) => {
  res.json({
    name: 'Evolyn API',
    description: 'AI-Powered Brand Governance Platform Backend',
    version: '0.1.0',
    documentation: '/health',
  });
});

// Health Checks
app.use('/', healthRouter);
app.use('/api', healthRouter);
app.use('/api', reviewsRouter);
app.use('/api', decisionsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/review-runs', findingsRouter);
app.use('/api/guidelines', guidelinesRouter);
app.use('/api/knowledge', knowledgeRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use(errorHandler);

export default app;
