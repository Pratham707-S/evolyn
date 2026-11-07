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

  // Handle Brand Governance Retrieval & Runtime Verification Failures
  if (
    err !== null &&
    typeof err === 'object' &&
    'code' in err &&
    err.code === 'BRAND_GOVERNANCE_RETRIEVAL_FAILED'
  ) {
    console.error(`[API Error] Brand governance failure:`, err);
    return res.status(503).json({
      error:
        'Brand governance verification failed: context could not be verified or output violated critical brand guardrails.',
      code: 'BRAND_GOVERNANCE_RETRIEVAL_FAILED',
    });
  }

  // Handle Standard Errors
  if (err instanceof Error) {
    console.error(`[API Error] ${err.message}`, err.stack);
    const isSensitiveLeak =
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('password') ||
      err.message.includes('postgres://') ||
      err.message.includes('SELECT ') ||
      err.message.includes('INSERT ') ||
      err.message.includes('UPDATE ');
    return res.status(500).json({
      error: isSensitiveLeak ? 'Internal server error' : err.message || 'Internal server error',
    });
  }

  // Fallback for non-Error or malformed objects
  console.error('[API Error] Unknown exception:', err);
  return res.status(500).json({
    error: 'Internal server error',
  });
}
