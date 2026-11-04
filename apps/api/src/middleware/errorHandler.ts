import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

interface ValidationIssue {
  path: (string | number)[];
  message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidationIssue(value: unknown): value is ValidationIssue {
  return (
    isRecord(value) &&
    Array.isArray(value.path) &&
    value.path.every((part) => typeof part === 'string' || typeof part === 'number') &&
    typeof value.message === 'string'
  );
}

function getValidationIssues(error: unknown): ValidationIssue[] | null {
  if (error instanceof ZodError) {
    return error.errors;
  }

  if (
    !isRecord(error) ||
    error.name !== 'ZodError' ||
    !Array.isArray(error.errors) ||
    !error.errors.every(isValidationIssue)
  ) {
    return null;
  }

  return error.errors;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const validationIssues = getValidationIssues(err);
  if (validationIssues) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validationIssues.map((e) => ({
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
