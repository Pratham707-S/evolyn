import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import type { IKnowledgeService } from './index.js';
import { knowledgeService } from './knowledge.service.js';

export const knowledgeQuerySchema = z.object({
    topic: z.string().min(1).max(100).optional(),
});

type KnowledgeControllerService = IKnowledgeService;

export function createKnowledgeController(
    service: KnowledgeControllerService = knowledgeService,
) {
    const createFact = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const fact = await service.createFact(req.body);

            return res.status(201).json(fact);
        } catch (error) {
            return next(error);
        }
    };

    const getFacts = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const validatedQuery = knowledgeQuerySchema.parse(req.query);

            const facts = await service.listFacts(validatedQuery.topic);

            return res.status(200).json(facts);
        } catch (error) {
            return next(error);
        }
    };

    const getFactById = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const fact = await service.getFactById(req.params.id);
            if (!fact) {
                return res.status(404).json({ error: 'Approved fact not found' });
            }
            return res.status(200).json(fact);
        } catch (error) {
            return next(error);
        }
    };

    const deleteFact = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const deleted = await service.deleteFact(req.params.id);
            if (!deleted) {
                return res.status(404).json({ error: 'Approved fact not found' });
            }
            return res.status(200).json({ success: true, id: req.params.id });
        } catch (error) {
            return next(error);
        }
    };

    return {
        createFact,
        getFacts,
        getFactById,
        deleteFact,
    };
}

export const knowledgeController = createKnowledgeController();
