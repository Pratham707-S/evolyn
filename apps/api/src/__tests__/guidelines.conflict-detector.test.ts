import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { detectRuleConflicts } from '../modules/guidelines/conflict-detector.js';

import type { ConflictRule } from '../modules/guidelines/conflict-detector.js';

const rules: ConflictRule[] = [
    {
        id: 'rule-1',
        ruleType: 'MANDATORY',
        ruleStatement: 'Always use blue backgrounds.',
        severity: 'CRITICAL',
    },
    {
        id: 'rule-2',
        ruleType: 'PROHIBITED',
        ruleStatement: 'Never use blue backgrounds.',
        severity: 'WARNING',
    },
];

describe('Guideline Conflict Detector', () => {
    it('detects explicitly opposite instructions', () => {
        const conflicts = detectRuleConflicts(rules);

        assert.equal(conflicts.length, 1);
        assert.equal(conflicts[0]?.conflictType, 'CONTRADICTION');
        assert.equal(conflicts[0]?.ruleAId, 'rule-1');
        assert.equal(conflicts[0]?.ruleBId, 'rule-2');
        assert.equal(conflicts[0]?.severity, 'CRITICAL');
    });

    it('does not flag unrelated rules', () => {
        const input: ConflictRule[] = [
            {
                id: 'rule-1',
                ruleType: 'MANDATORY',
                ruleStatement: 'Always use blue backgrounds.',
                severity: 'WARNING',
            },
            {
                id: 'rule-2',
                ruleType: 'PROHIBITED',
                ruleStatement: 'Never distort the logo.',
                severity: 'WARNING',
            },
        ];

        assert.deepEqual(detectRuleConflicts(input), []);
    });

    it('does not compare a rule with itself', () => {
        const input = [rules[0]!];

        assert.deepEqual(detectRuleConflicts(input), []);
    });

    it('returns no conflicts for an empty rule list', () => {
        assert.deepEqual(detectRuleConflicts([]), []);
    });

    it('does not compare duplicate IDs', () => {
        const input = [
            rules[0]!,
            { ...rules[1]!, id: 'rule-1' },
        ];

        assert.deepEqual(detectRuleConflicts(input), []);
    });

    it('checks every unique rule pair', () => {
        const input: ConflictRule[] = [
            ...rules,
            {
                id: 'rule-3',
                ruleType: 'MANDATORY',
                ruleStatement: 'Always use the official logo.',
                severity: 'WARNING',
            },
        ];

        const conflicts = detectRuleConflicts(input);

        assert.equal(conflicts.length, 1);
    });
});
