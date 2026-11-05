import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ZodError } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import type { Guideline } from '@evolyn/shared';
import { createGuidelinesController } from '../modules/guidelines/guidelines.controller.js';

const mockGuideline: Guideline = {
    id: 'g1',
    title: 'Brand Guidelines',
    category: 'GENERAL',
    version: '1.0',
    rawContent: 'These are the brand guidelines.',
    s3Url: null,
    status: 'ACTIVE',
    createdAt: '2026-11-04T10:00:00.000Z',
    updatedAt: '2026-11-04T10:00:00.000Z',
};

// Minimal Express response mock
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

describe('GuidelinesController', () => {
    it('creates a guideline and returns 201', async () => {
        const expected = mockGuideline;

        const service = {
            createGuideline: async () => expected,
            getGuidelines: async () => [],
            getGuidelineById: async () => null,
            extractAndSaveRules: async () => [],
            detectAndSaveConflicts: async () => [],
        };

        const controller = createGuidelinesController(service);
        const req = createRequest({ body: { title: 'Brand Guidelines' } });
        const res = createResponse();

        await controller.createGuideline(
            req,
            res as unknown as Response,
            (() => { }) as NextFunction,
        );

        assert.equal(res.statusCode, 201);
        assert.deepEqual(res.body, expected);
    });

    it('returns guidelines with 200', async () => {
        const expected = [mockGuideline];

        const service = {
            createGuideline: async () => expected[0],
            getGuidelines: async () => expected,
            getGuidelineById: async () => null,
            extractAndSaveRules: async () => [],
            detectAndSaveConflicts: async () => [],
        };

        const controller = createGuidelinesController(service);
        const req = createRequest();
        const res = createResponse();

        await controller.getGuidelines(
            req,
            res as unknown as Response,
            (() => { }) as NextFunction,
        );

        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, expected);
    });

    it('rejects invalid query parameters by forwarding ZodError to error middleware', async () => {
        const service = {
            createGuideline: async () => mockGuideline,
            getGuidelines: async () => [],
            getGuidelineById: async () => null,
            extractAndSaveRules: async () => [],
            detectAndSaveConflicts: async () => [],
        };

        const controller = createGuidelinesController(service);
        const req = createRequest({
            query: { category: ['TONE', 'LEGAL'] } as unknown as Request['query'],
        });
        const res = createResponse();
        let forwardedError: unknown;
        const next: NextFunction = (error?: unknown) => {
            forwardedError = error;
            return undefined as never;
        };

        await controller.getGuidelines(
            req,
            res as unknown as Response,
            next,
        );

        assert.ok(forwardedError instanceof ZodError);
    });

    it('rejects invalid category enum query parameter by forwarding ZodError', async () => {
        const service = {
            createGuideline: async () => mockGuideline,
            getGuidelines: async () => [],
            getGuidelineById: async () => null,
            extractAndSaveRules: async () => [],
            detectAndSaveConflicts: async () => [],
        };

        const controller = createGuidelinesController(service);
        const req = createRequest({
            query: { category: 'NON_EXISTENT_CATEGORY' } as unknown as Request['query'],
        });
        const res = createResponse();
        let forwardedError: unknown;
        const next: NextFunction = (error?: unknown) => {
            forwardedError = error;
            return undefined as never;
        };

        await controller.getGuidelines(
            req,
            res as unknown as Response,
            next,
        );

        assert.ok(forwardedError instanceof ZodError);
    });

    it('returns 404 when guideline does not exist', async () => {
        const service = {
            createGuideline: async () => mockGuideline,
            getGuidelines: async () => [],
            getGuidelineById: async () => null,
            extractAndSaveRules: async () => [],
            detectAndSaveConflicts: async () => [],
        };

        const controller = createGuidelinesController(service);
        const req = createRequest({ params: { id: 'missing' } });
        const res = createResponse();

        await controller.getGuidelineById(
            req,
            res as unknown as Response,
            (() => { }) as NextFunction,
        );

        assert.equal(res.statusCode, 404);
        assert.deepEqual(res.body, { error: 'Guideline not found' });
    });

    it('forwards service errors to Express error middleware', async () => {
        const expectedError = new Error('Database unavailable');
        let forwardedError: unknown;

        const service = {
            createGuideline: async () => {
                throw expectedError;
            },
            getGuidelines: async () => [],
            getGuidelineById: async () => null,
            extractAndSaveRules: async () => [],
            detectAndSaveConflicts: async () => [],
        };

        const controller = createGuidelinesController(service);
        const req = createRequest();
        const res = createResponse();

        const next: NextFunction = (error?: unknown) => {
            forwardedError = error;
            return undefined as never;
        };

        await controller.createGuideline(req, res as unknown as Response, next);

        assert.equal(forwardedError, expectedError);
    });

    it('forwards category and status filters to service', async () => {
        let receivedFilters: unknown;

        const service = {
            createGuideline: async () => mockGuideline,
            getGuidelines: async (filters: unknown) => {
                receivedFilters = filters;
                return [];
            },
            getGuidelineById: async () => null,
            extractAndSaveRules: async () => [],
            detectAndSaveConflicts: async () => [],
        };

        const controller = createGuidelinesController(service);
        const req = createRequest({
            query: { category: 'TONE', status: 'ACTIVE' },
        });
        const res = createResponse();

        await controller.getGuidelines(
            req,
            res as unknown as Response,
            (() => { }) as NextFunction,
        );

        assert.deepEqual(receivedFilters, {
            category: 'TONE',
            status: 'ACTIVE',
        });
        assert.equal(res.statusCode, 200);
    });
    it('returns an existing guideline with 200', async () => {
        const expected = {
            ...mockGuideline,
            rules: [],
        };

        const service = {
            createGuideline: async () => mockGuideline,
            getGuidelines: async () => [],
            getGuidelineById: async () => expected,
            extractAndSaveRules: async () => [],
            detectAndSaveConflicts: async () => [],
        };

        const controller = createGuidelinesController(service);
        const req = createRequest({ params: { id: 'g1' } });
        const res = createResponse();

        await controller.getGuidelineById(
            req,
            res as unknown as Response,
            (() => { }) as NextFunction,
        );

        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, expected);
    });

    it('extracts rules and returns 200 with rules and total count', async () => {
        const validUuid = 'c0a80123-4567-4890-a123-456789abcdef';
        const expectedRules = [
            {
                id: 'r1',
                guidelineId: validUuid,
                ruleType: 'MANDATORY' as const,
                ruleStatement: 'Always include logo.',
                explanation: 'Brand rule.',
                severity: 'CRITICAL' as const,
                createdAt: '2026-11-04T10:00:00.000Z',
            },
        ];

        const service = {
            createGuideline: async () => mockGuideline,
            getGuidelines: async () => [],
            getGuidelineById: async () => null,
            extractAndSaveRules: async () => expectedRules,
            detectAndSaveConflicts: async () => [],
        };

        const controller = createGuidelinesController(service);
        const req = createRequest({
            params: { id: validUuid },
            body: {},
        });
        const res = createResponse();

        await controller.extractRules(
            req,
            res as unknown as Response,
            (() => { }) as NextFunction,
        );

        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, {
            guidelineId: validUuid,
            rules: expectedRules,
            total: 1,
        });
    });

    it('returns 404 when extracting rules for nonexistent guideline', async () => {
        const validUuid = 'c0a80123-4567-4890-a123-456789abcdef';

        const service = {
            createGuideline: async () => mockGuideline,
            getGuidelines: async () => [],
            getGuidelineById: async () => null,
            extractAndSaveRules: async () => {
                throw new Error('Guideline not found');
            },
            detectAndSaveConflicts: async () => [],
        };

        const controller = createGuidelinesController(service);
        const req = createRequest({ params: { id: validUuid } });
        const res = createResponse();

        await controller.extractRules(
            req,
            res as unknown as Response,
            (() => { }) as NextFunction,
        );

        assert.equal(res.statusCode, 404);
        assert.deepEqual(res.body, { error: 'Guideline not found' });
    });

    it('returns 400 when guideline content is empty for extraction', async () => {
        const validUuid = 'c0a80123-4567-4890-a123-456789abcdef';

        const service = {
            createGuideline: async () => mockGuideline,
            getGuidelines: async () => [],
            getGuidelineById: async () => null,
            extractAndSaveRules: async () => {
                throw new Error('Guideline content cannot be empty');
            },
            detectAndSaveConflicts: async () => [],
        };

        const controller = createGuidelinesController(service);
        const req = createRequest({ params: { id: validUuid } });
        const res = createResponse();

        await controller.extractRules(
            req,
            res as unknown as Response,
            (() => { }) as NextFunction,
        );

        assert.equal(res.statusCode, 400);
        assert.deepEqual(res.body, { error: 'Guideline content cannot be empty' });
    });

    it('forwards ZodError to next function when extractRules param is not a valid UUID', async () => {
        let capturedError: unknown;

        const service = {
            createGuideline: async () => mockGuideline,
            getGuidelines: async () => [],
            getGuidelineById: async () => null,
            extractAndSaveRules: async () => [],
            detectAndSaveConflicts: async () => [],
        };

        const controller = createGuidelinesController(service);
        const req = createRequest({ params: { id: 'invalid-uuid' } });
        const res = createResponse();

        await controller.extractRules(
            req,
            res as unknown as Response,
            ((err: unknown) => {
                capturedError = err;
            }) as NextFunction,
        );

        assert.ok(capturedError instanceof ZodError);
    });

    it('forwards ZodError to next function when request body contains rawContent or unexpected fields', async () => {
        let capturedError: unknown;

        const service = {
            createGuideline: async () => mockGuideline,
            getGuidelines: async () => [],
            getGuidelineById: async () => null,
            extractAndSaveRules: async () => [],
            detectAndSaveConflicts: async () => [],
        };

        const controller = createGuidelinesController(service);
        const req = createRequest({
            params: { id: 'c0a80123-4567-4890-a123-456789abcdef' },
            body: { rawContent: 'Disallowed caller-provided text' },
        });
        const res = createResponse();

        await controller.extractRules(
            req,
            res as unknown as Response,
            ((err: unknown) => {
                capturedError = err;
            }) as NextFunction,
        );

        assert.ok(capturedError instanceof ZodError);
    });

    describe('detectConflicts controller tests', () => {
        const validUuid = 'c0a80123-4567-4890-a123-456789abcdef';
        const expectedConflicts = [
            {
                id: 'conflict-1',
                ruleAId: 'r1',
                ruleBId: 'r2',
                conflictType: 'CONTRADICTION' as const,
                explanation: 'Contradictory rules',
                severity: 'CRITICAL' as const,
                status: 'OPEN' as const,
                createdAt: new Date('2026-11-04T10:00:00.000Z'),
            },
        ];

        it('detects conflicts and returns 200 with conflicts and total count', async () => {
            const service = {
                createGuideline: async () => mockGuideline,
                getGuidelines: async () => [],
                getGuidelineById: async () => null,
                extractAndSaveRules: async () => [],
                detectAndSaveConflicts: async () => expectedConflicts,
            };

            const controller = createGuidelinesController(service);
            const req = createRequest({ params: { id: validUuid } });
            const res = createResponse();

            await controller.detectConflicts(
                req,
                res as unknown as Response,
                (() => {}) as NextFunction,
            );

            assert.equal(res.statusCode, 200);
            assert.deepEqual(res.body, {
                guidelineId: validUuid,
                conflicts: expectedConflicts,
                total: 1,
            });
        });

        it('returns 404 when guideline does not exist for conflict detection', async () => {
            const service = {
                createGuideline: async () => mockGuideline,
                getGuidelines: async () => [],
                getGuidelineById: async () => null,
                extractAndSaveRules: async () => [],
                detectAndSaveConflicts: async () => {
                    throw new Error('Guideline not found');
                },
            };

            const controller = createGuidelinesController(service);
            const req = createRequest({ params: { id: validUuid } });
            const res = createResponse();

            await controller.detectConflicts(
                req,
                res as unknown as Response,
                (() => {}) as NextFunction,
            );

            assert.equal(res.statusCode, 404);
            assert.deepEqual(res.body, { error: 'Guideline not found' });
        });

        it('forwards ZodError when detectConflicts param is not a valid UUID', async () => {
            let capturedError: unknown;

            const service = {
                createGuideline: async () => mockGuideline,
                getGuidelines: async () => [],
                getGuidelineById: async () => null,
                extractAndSaveRules: async () => [],
                detectAndSaveConflicts: async () => [],
            };

            const controller = createGuidelinesController(service);
            const req = createRequest({ params: { id: 'invalid-uuid-123' } });
            const res = createResponse();

            await controller.detectConflicts(
                req,
                res as unknown as Response,
                ((err: unknown) => {
                    capturedError = err;
                }) as NextFunction,
            );

            assert.ok(capturedError instanceof ZodError);
        });

        it('forwards ZodError when detectConflicts receives unexpected request body fields', async () => {
            let capturedError: unknown;

            const service = {
                createGuideline: async () => mockGuideline,
                getGuidelines: async () => [],
                getGuidelineById: async () => null,
                extractAndSaveRules: async () => [],
                detectAndSaveConflicts: async () => [],
            };

            const controller = createGuidelinesController(service);
            const req = createRequest({
                params: { id: validUuid },
                body: { unexpected: 'field' },
            });
            const res = createResponse();

            await controller.detectConflicts(
                req,
                res as unknown as Response,
                ((err: unknown) => {
                    capturedError = err;
                }) as NextFunction,
            );

            assert.ok(capturedError instanceof ZodError);
        });
    });
});