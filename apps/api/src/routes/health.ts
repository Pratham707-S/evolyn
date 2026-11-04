import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../db/index.js';
import { env } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/health', async (req: Request, res: Response) => {
  const isDbConnected = await checkDatabaseConnection();

  const payload = {
    status: 'ok',
    service: 'evolyn-api',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    database: isDbConnected ? 'connected' : 'disconnected',
    gemini: {
      model: env.GEMINI_MODEL,
      embeddingModel: env.GEMINI_EMBEDDING_MODEL,
      configured: Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 5),
    },
  };

  // If database is disconnected, return 503 so load balancers / health checks see degraded state
  const httpStatus = isDbConnected ? 200 : 503;
  return res.status(httpStatus).json(payload);
});
