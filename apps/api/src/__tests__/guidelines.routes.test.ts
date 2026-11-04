import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { guidelinesRouter } from '../modules/guidelines/guidelines.routes.js';
import { guidelinesController } from '../modules/guidelines/guidelines.controller.js';

type RouteLayer = {
    route?: {
        path: string;
        methods: Record<string, boolean>;
        stack: Array<{ handle: unknown }>;
    };
};

const routerStack = (
    guidelinesRouter as unknown as { stack: RouteLayer[] }
).stack;


function findRoute(path: string, method: 'get' | 'post') {
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

describe('GuidelinesRoutes', () => {
    it('registers POST / with createGuideline controller', () => {
        const route = findRoute('/', 'post');

        assert.equal(
            route.stack[0]?.handle,
            guidelinesController.createGuideline,
        );
    });

    it('registers GET / with getGuidelines controller', () => {
        const route = findRoute('/', 'get');

        assert.equal(
            route.stack[0]?.handle,
            guidelinesController.getGuidelines,
        );
    });

    it('registers GET /:id with getGuidelineById controller', () => {
        const route = findRoute('/:id', 'get');

        assert.equal(
            route.stack[0]?.handle,
            guidelinesController.getGuidelineById,
        );
    });
});
