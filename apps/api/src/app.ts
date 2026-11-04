import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { guidelinesRouter } from './modules/guidelines/guidelines.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

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

// Guidelines Module
app.use('/api/guidelines', guidelinesRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use(errorHandler);

export default app;
