import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // Handle Zod Validation Errors (with cross-package resilience)
  if (
    err instanceof ZodError ||
    (err !== null &&
      typeof err === 'object' &&
      'name' in err &&
      err.name === 'ZodError' &&
      'errors' in err &&
      Array.isArray(err.errors))
  ) {
    const zodErr = err as ZodError;
    return res.status(400).json({
      error: 'Validation failed',
      details: zodErr.errors.map((e) => ({
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
