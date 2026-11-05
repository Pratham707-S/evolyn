import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ZodError } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import type { ApprovedFact } from '@evolyn/shared';

import { createKnowledgeController } from '../modules/knowledge/knowledge.controller.js';

const mockFact: ApprovedFact = {
    id: 'fact-1',
    topic: 'Product',
    claimStatement: 'Our product supports secure cloud storage.',
    approvedProofSource: 'https://example.com/proof',
    validUntil: null,
    createdAt: '2026-11-05T07:00:00.000Z',
};

function createResponse() {
    const response = {
        statusCode: 200,
        body: undefined as unknown,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(data: unknown) {
            this.body = data;
            return this;
        },
    };

    return response;
}

function createRequest(overrides: Partial<Request> = {}) {
    return {
        body: {},
        query: {},
        params: {},
        ...overrides,
    } as Request;
}

describe('KnowledgeController', () => {
    it('creates an approved fact and returns 201', async () => {
        const service = {
            createFact: async () => mockFact,
            listFacts: async () => [mockFact],
            findRelevantFacts: async () => [],
            generateAndSaveEmbeddings: async () => 0,
        };

        const controller = createKnowledgeController(service);
        const req = createRequest({ body: mockFact });
        const res = createResponse();

        await controller.createFact(
            req,
            res as unknown as Response,
            (() => {}) as NextFunction,
        );

        assert.equal(res.statusCode, 201);
        assert.deepEqual(res.body, mockFact);
    });

    it('returns approved facts with 200', async () => {
        const expected = [mockFact];

        const service = {
            createFact: async () => mockFact,
            listFacts: async () => expected,
            findRelevantFacts: async () => [],
            generateAndSaveEmbeddings: async () => 0,
        };

        const controller = createKnowledgeController(service);
        const req = createRequest();
        const res = createResponse();

        await controller.getFacts(
            req,
            res as unknown as Response,
            (() => {}) as NextFunction,
        );

        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, expected);
    });

    it('forwards invalid topic query as ZodError', async () => {
        const service = {
            createFact: async () => mockFact,
            listFacts: async () => [],
            findRelevantFacts: async () => [],
            generateAndSaveEmbeddings: async () => 0,
        };

        const controller = createKnowledgeController(service);
        const req = createRequest({
            query: { topic: ['Product', 'Finance'] } as unknown as Request['query'],
        });
        const res = createResponse();

        let forwardedError: unknown;

        const next: NextFunction = (error?: unknown) => {
            forwardedError = error;
            return undefined as never;
        };

        await controller.getFacts(
            req,
            res as unknown as Response,
            next,
        );

        assert.ok(forwardedError instanceof ZodError);
    });

    it('forwards invalid empty topic query as ZodError', async () => {
        const service = {
            createFact: async () => mockFact,
            listFacts: async () => [],
            findRelevantFacts: async () => [],
            generateAndSaveEmbeddings: async () => 0,
        };

        const controller = createKnowledgeController(service);
        const req = createRequest({
            query: { topic: '' },
        });
        const res = createResponse();

        let forwardedError: unknown;

        const next: NextFunction = (error?: unknown) => {
            forwardedError = error;
            return undefined as never;
        };

        await controller.getFacts(
            req,
            res as unknown as Response,
            next,
        );

        assert.ok(forwardedError instanceof ZodError);
    });

    it('forwards service errors to Express error middleware', async () => {
        const expectedError = new Error('Database unavailable');

        const service = {
            createFact: async () => {
                throw expectedError;
            },
            listFacts: async () => [],
            findRelevantFacts: async () => [],
            generateAndSaveEmbeddings: async () => 0,
        };

        const controller = createKnowledgeController(service);
        const req = createRequest({ body: mockFact });
        const res = createResponse();

        let forwardedError: unknown;

        const next: NextFunction = (error?: unknown) => {
            forwardedError = error;
            return undefined as never;
        };

        await controller.createFact(
            req,
            res as unknown as Response,
            next,
        );

        assert.equal(forwardedError, expectedError);
    });

    it('forwards topic filter to service', async () => {
        let receivedTopic: string | undefined;

        const service = {
            createFact: async () => mockFact,
            listFacts: async (topic?: string) => {
                receivedTopic = topic;
                return [mockFact];
            },
            findRelevantFacts: async () => [],
            generateAndSaveEmbeddings: async () => 0,
        };

        const controller = createKnowledgeController(service);
        const req = createRequest({
            query: { topic: 'Product' },
        });
        const res = createResponse();

        await controller.getFacts(
            req,
            res as unknown as Response,
            (() => {}) as NextFunction,
        );

        assert.equal(receivedTopic, 'Product');
        assert.equal(res.statusCode, 200);
    });

    it('forwards errors from fact listing to error middleware', async () => {
        const expectedError = new Error('Database unavailable');

        const service = {
            createFact: async () => mockFact,
            listFacts: async () => {
                throw expectedError;
            },
            findRelevantFacts: async () => [],
            generateAndSaveEmbeddings: async () => 0,
        };

        const controller = createKnowledgeController(service);
        const req = createRequest();
        const res = createResponse();

        let forwardedError: unknown;

        const next: NextFunction = (error?: unknown) => {
            forwardedError = error;
            return undefined as never;
        };

        await controller.getFacts(
            req,
            res as unknown as Response,
            next,
        );

        assert.equal(forwardedError, expectedError);
    });
});
