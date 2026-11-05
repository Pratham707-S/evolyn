import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Decision } from '@evolyn/shared';

import type { IDecisionService } from '../index.js';
import { createDecisionsRouter } from '../decisions.routes.js';

const decision: Decision = {
  id: 'd0a80123-4567-4890-a123-456789abcdef',
  submissionId: 'c0a80123-4567-4890-a123-456789abcdef',
  decision: 'APPROVED',
  reviewerName: 'Judge Pratham',
  comments: 'Approved.',
  overriddenIssueIds: [],
  createdAt: '2026-11-05T10:00:00.000Z',
};

function createService(): IDecisionService {
  return {
    recordDecision: async () => decision,
    getDecisionBySubmissionId: async () => decision,
  };
}

describe('Decisions routes', () => {
  it('registers the submit and read decision endpoints', () => {
    const router = createDecisionsRouter(createService());
    const routes = router.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route?.path,
        methods: layer.route?.stack.map((routeLayer) => routeLayer.method),
      }));

    assert.deepEqual(routes, [
      { path: '/submissions/:id/decision', methods: ['post'] },
      { path: '/submissions/:id/decision', methods: ['get'] },
    ]);
  });
});
