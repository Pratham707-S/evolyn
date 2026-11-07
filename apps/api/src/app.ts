import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { healthRouter } from './routes/health.js';

import { guidelinesRouter } from './modules/guidelines/guidelines.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { submissionsRouter } from './modules/submissions/submissions.routes.js';
import { findingsRouter } from './modules/findings/findings.routes.js';
import { knowledgeRouter } from './modules/knowledge/knowledge.routes.js';
import { reviewsRouter } from './modules/reviews/reviews.routes.js';
import { decisionsRouter } from './modules/decisions/decisions.routes.js';
import { submissionService } from './modules/submissions/submissions.service.js';
import { generateSimplePdf } from './modules/submissions/services/pdf-generator.service.js';

export const app = express();

// Global Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Fallback for /uploads/:filename when ephemeral container disk was wiped
app.get('/uploads/:filename', async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const submission = await submissionService.findByFileUrlPattern(filename);
    if (submission) {
      if (submission.fileUrl && submission.fileUrl.startsWith('data:')) {
        const [, base64Data] = submission.fileUrl.split(',');
        const buffer = Buffer.from(base64Data, 'base64');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Content-Disposition', `inline; filename="${submission.title || filename}"`);
        res.send(buffer);
        return;
      }
      if (submission.rawText) {
        const buffer = generateSimplePdf(submission.title || filename, submission.rawText);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Content-Disposition', `inline; filename="${submission.title || filename}"`);
        res.send(buffer);
        return;
      }
    }
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
  } catch (err) {
    next(err);
  }
});


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
