import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { knowledgeRouter } from '../modules/knowledge/knowledge.routes.js';
import { knowledgeController } from '../modules/knowledge/knowledge.controller.js';

type RouteLayer = {
    route?: {
        path: string;
        methods: Record<string, boolean>;
        stack: Array<{ handle: unknown }>;
    };
};

const routerStack = (
    knowledgeRouter as unknown as { stack: RouteLayer[] }
).stack;

function findRoute(path: string, method: 'get' | 'post' | 'delete') {
    const route = routerStack.find(
        (layer) =>
            layer.route?.path === path &&
            layer.route.methods[method] === true,
    )?.route;

    assert.ok(
        route,
        `Route ${method.toUpperCase()} ${path} should exist`,
    );

    return route;
}

describe('KnowledgeRoutes', () => {
    it('registers POST /facts with createFact controller', () => {
        const route = findRoute('/facts', 'post');

        assert.equal(
            route.stack[0]?.handle,
            knowledgeController.createFact,
        );
    });

    it('registers GET /facts with getFacts controller', () => {
        const route = findRoute('/facts', 'get');

        assert.equal(
            route.stack[0]?.handle,
            knowledgeController.getFacts,
        );
    });

    it('registers GET /facts/:id with getFactById controller', () => {
        const route = findRoute('/facts/:id', 'get');

        assert.equal(
            route.stack[0]?.handle,
            knowledgeController.getFactById,
        );
    });

    it('registers DELETE /facts/:id with deleteFact controller', () => {
        const route = findRoute('/facts/:id', 'delete');

        assert.equal(
            route.stack[0]?.handle,
            knowledgeController.deleteFact,
        );
    });
});
