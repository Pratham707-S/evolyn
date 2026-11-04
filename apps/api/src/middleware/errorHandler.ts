import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle Standard Errors
  if (err instanceof Error) {
    console.error(`[API Error] ${err.message}`, err.stack);
    return res.status(500).json({
      error: err.message || 'Internal server error',
    });
  }

  // Fallback
  console.error('[API Error] Unknown exception:', err);
  return res.status(500).json({
    error: 'Internal server error',
  });
}
