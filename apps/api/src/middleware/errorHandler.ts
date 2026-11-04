import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

interface ZodIssueLike {
  path: unknown[];
  message: string;
}

function isZodIssueLike(issue: unknown): issue is ZodIssueLike {
  return (
    issue !== null &&
    typeof issue === 'object' &&
    'path' in issue &&
    Array.isArray(issue.path) &&
    'message' in issue &&
    typeof issue.message === 'string'
  );
}

function isValidZodError(err: unknown): err is ZodError {
  if (err instanceof ZodError) {
    return true;
  }

  return (
    err !== null &&
    typeof err === 'object' &&
    'name' in err &&
    err.name === 'ZodError' &&
    'errors' in err &&
    Array.isArray(err.errors) &&
    err.errors.every(isZodIssueLike)
  );
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // Handle Valid Zod Validation Errors (with cross-package structural validation)
  if (isValidZodError(err)) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: Array.isArray(e.path) ? e.path.join('.') : '',
        message: typeof e.message === 'string' ? e.message : 'Invalid value',
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

  // Fallback for non-Error or malformed objects
  console.error('[API Error] Unknown exception:', err);
  return res.status(500).json({
    error: 'Internal server error',
  });
}
