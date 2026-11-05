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

    it('detects MANDATORY vs PROHIBITED contradiction even without polarity words in statements', () => {
        const input: ConflictRule[] = [
            {
                id: 'r-1',
                ruleType: 'MANDATORY',
                ruleStatement: 'Include copyright notice in footer.',
                severity: 'WARNING',
            },
            {
                id: 'r-2',
                ruleType: 'PROHIBITED',
                ruleStatement: 'Include copyright notice in footer.',
                severity: 'WARNING',
            },
        ];

        const conflicts = detectRuleConflicts(input);
        assert.equal(conflicts.length, 1);
        assert.equal(conflicts[0]?.conflictType, 'CONTRADICTION');
        assert.equal(conflicts[0]?.ruleAId, 'r-1');
        assert.equal(conflicts[0]?.ruleBId, 'r-2');
    });

    it('detects opposite lexical polarity (must vs must not)', () => {
        const input: ConflictRule[] = [
            {
                id: 'r-1',
                ruleType: 'MANDATORY',
                ruleStatement: 'You must display the brand emblem on light backgrounds.',
                severity: 'SUGGESTION',
            },
            {
                id: 'r-2',
                ruleType: 'MANDATORY',
                ruleStatement: 'You must not display the brand emblem on light backgrounds.',
                severity: 'CRITICAL',
            },
        ];

        const conflicts = detectRuleConflicts(input);
        assert.equal(conflicts.length, 1);
        assert.equal(conflicts[0]?.severity, 'CRITICAL');
        assert.equal(conflicts[0]?.conflictType, 'CONTRADICTION');
    });

    it('handles negation edge case: "do not always" vs "always"', () => {
        const input: ConflictRule[] = [
            {
                id: 'r-1',
                ruleType: 'RECOMMENDED',
                ruleStatement: 'Always underline hyperlinks in body text.',
                severity: 'WARNING',
            },
            {
                id: 'r-2',
                ruleType: 'RECOMMENDED',
                ruleStatement: 'Do not always underline hyperlinks in body text.',
                severity: 'SUGGESTION',
            },
        ];

        const conflicts = detectRuleConflicts(input);
        assert.equal(conflicts.length, 1);
        assert.equal(conflicts[0]?.conflictType, 'CONTRADICTION');
        assert.equal(conflicts[0]?.severity, 'WARNING');
    });

    it('prioritizes severity correctly (CRITICAL > WARNING > SUGGESTION)', () => {
        const input: ConflictRule[] = [
            {
                id: 'r-1',
                ruleType: 'MANDATORY',
                ruleStatement: 'Always center-align headings.',
                severity: 'SUGGESTION',
            },
            {
                id: 'r-2',
                ruleType: 'PROHIBITED',
                ruleStatement: 'Never center-align headings.',
                severity: 'CRITICAL',
            },
        ];

        const conflicts = detectRuleConflicts(input);
        assert.equal(conflicts.length, 1);
        assert.equal(conflicts[0]?.severity, 'CRITICAL');
    });

    it('ensures rule IDs are canonically ordered (ruleAId <= ruleBId) regardless of input order', () => {
        const inputReversed: ConflictRule[] = [
            {
                id: 'rule-z',
                ruleType: 'PROHIBITED',
                ruleStatement: 'Never use comic sans.',
                severity: 'WARNING',
            },
            {
                id: 'rule-a',
                ruleType: 'MANDATORY',
                ruleStatement: 'Always use comic sans.',
                severity: 'WARNING',
            },
        ];

        const conflicts = detectRuleConflicts(inputReversed);
        assert.equal(conflicts.length, 1);
        assert.equal(conflicts[0]?.ruleAId, 'rule-a');
        assert.equal(conflicts[0]?.ruleBId, 'rule-z');
    });
});
