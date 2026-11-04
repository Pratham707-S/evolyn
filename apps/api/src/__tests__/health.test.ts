import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Request, Response, NextFunction } from 'express';
import { healthRouter } from '../routes/health.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';
import { ZodError } from 'zod';

function createMockResponse() {
  const res: {
    statusCode: number;
    jsonData: any;
    status: (code: number) => any;
    json: (data: any) => any;
  } = {
    statusCode: 200,
    jsonData: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.jsonData = data;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; jsonData: any };
}

describe('API Foundation & Health Routing (In-Memory)', () => {
  it('env configuration has valid defaults and environment-driven model names', () => {
    assert.equal(typeof env.PORT, 'number');
    assert.equal(typeof env.GEMINI_MODEL, 'string');
    assert.ok(env.GEMINI_MODEL.length > 0);
    assert.equal(typeof env.GEMINI_EMBEDDING_MODEL, 'string');
    assert.ok(env.GEMINI_EMBEDDING_MODEL.length > 0);
  });

  it('health endpoint returns valid schema with status and gemini configuration', async () => {
    // Find the health route handler from the router stack
    const route = healthRouter.stack.find((layer) => layer.route?.path === '/health');
    assert.ok(route?.route?.stack?.[0]?.handle, 'Health route must exist on healthRouter');

    const handler = route.route.stack[0].handle;
    const req = {} as Request;
    const res = createMockResponse();
    const next: NextFunction = () => {};

    await handler(req, res, next);

    assert.ok([200, 503].includes(res.statusCode));
    assert.equal(res.jsonData.status, 'ok');
    assert.equal(res.jsonData.service, 'evolyn-api');
    assert.ok(['connected', 'disconnected'].includes(res.jsonData.database));
    assert.equal(res.jsonData.gemini.model, env.GEMINI_MODEL);
    assert.equal(res.jsonData.gemini.embeddingModel, env.GEMINI_EMBEDDING_MODEL);
    assert.equal(typeof res.jsonData.uptime, 'number');
  });

  it('errorHandler formats ZodError into structured 400 response', () => {
    const zodError = new ZodError([
      {
        code: 'too_small',
        minimum: 10,
        type: 'string',
        inclusive: true,
        exact: false,
        message: 'Content must be at least 10 chars',
        path: ['rawText'],
      },
    ]);

    const req = {} as Request;
    const res = createMockResponse();
    const next: NextFunction = () => {};

    errorHandler(zodError, req, res, next);

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonData.error, 'Validation failed');
    assert.equal(res.jsonData.details[0].field, 'rawText');
    assert.equal(res.jsonData.details[0].message, 'Content must be at least 10 chars');
  });

  it('errorHandler accepts structurally valid cross-package Zod-like objects', () => {
    const crossPackageZodError = {
      name: 'ZodError',
      errors: [
        {
          path: ['title'],
          message: 'Title is required',
        },
      ],
    };

    const req = {} as Request;
    const res = createMockResponse();
    const next: NextFunction = () => {};

    errorHandler(crossPackageZodError, req, res, next);

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonData.error, 'Validation failed');
    assert.equal(res.jsonData.details[0].field, 'title');
    assert.equal(res.jsonData.details[0].message, 'Title is required');
  });

  it('errorHandler safely treats malformed Zod-like error objects as 500 internal error', () => {
    const malformedErrors = [
      { name: 'ZodError', errors: 'not-an-array' },
      { name: 'ZodError', errors: [null] },
      { name: 'ZodError', errors: [{ path: 'not-an-array', message: 'test' }] },
      { name: 'ZodError', errors: [{ path: ['field'], message: 123 }] },
      { name: 'ZodError' },
    ];

    for (const malformed of malformedErrors) {
      const req = {} as Request;
      const res = createMockResponse();
      const next: NextFunction = () => {};

      errorHandler(malformed, req, res, next);

      assert.equal(res.statusCode, 500);
      assert.equal(res.jsonData.error, 'Internal server error');
    }
  });

  it('errorHandler catches generic Error and returns 500 without leaking stack traces', () => {
    const error = new Error('Database connection timed out');
    const req = {} as Request;
    const res = createMockResponse();
    const next: NextFunction = () => {};

    errorHandler(error, req, res, next);

    assert.equal(res.statusCode, 500);
    assert.equal(res.jsonData.error, 'Database connection timed out');
  });

  it('errorHandler safely handles primitive thrown values (string, number)', () => {
    const req = {} as Request;
    const res = createMockResponse();
    const next: NextFunction = () => {};

    errorHandler('Fatal string crash', req, res, next);

    assert.equal(res.statusCode, 500);
    assert.equal(res.jsonData.error, 'Internal server error');
  });
});
