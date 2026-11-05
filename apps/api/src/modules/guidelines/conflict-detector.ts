import type { RuleType, Severity } from '@evolyn/shared';

export type ConflictType =
    | 'CONTRADICTION'
    | 'AMBIGUITY'
    | 'OVERLAP';

export interface ConflictRule {
    id: string;
    ruleType: RuleType;
    ruleStatement: string;
    severity: Severity;
}

export interface DetectedConflict {
    ruleAId: string;
    ruleBId: string;
    conflictType: ConflictType;
    explanation: string;
    severity: Severity;
}

const NEGATIVE_PATTERNS = [
    /\bnever\b/i,
    /\bmust not\b/i,
    /\bshall not\b/i,
    /\bdo not\b/i,
    /\bdon't\b/i,
    /\bprohibited\b/i,
    /\bforbidden\b/i,
];

const POSITIVE_PATTERNS = [
    /\balways\b/i,
    /\bmust\b/i,
    /\bshall\b/i,
    /\brequired\b/i,
];

const MODAL_WORDS = new Set([
    'always', 'never', 'must', 'not', 'shall',
    'do', 'dont', 'required', 'prohibited',
    'forbidden', 'use', 'should', 'may',
    'the', 'a', 'an', 'be', 'is', 'are',
    'at', 'least', 'most', 'minimum',
    'maximum', 'no', 'less', 'more', 'than',
]);

function normalizeStatement(statement: string): string {
    return statement
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word && !MODAL_WORDS.has(word))
        .join(' ');
}

function getPolarity(statement: string): 'POSITIVE' | 'NEGATIVE' | null {
    if (NEGATIVE_PATTERNS.some((pattern) => pattern.test(statement))) {
        return 'NEGATIVE';
    }

    if (POSITIVE_PATTERNS.some((pattern) => pattern.test(statement))) {
        return 'POSITIVE';
    }

    return null;
}

function getSeverityRank(severity: Severity): number {
    const ranks: Record<Severity, number> = {
        CRITICAL: 3,
        WARNING: 2,
        SUGGESTION: 1,
    };

    return ranks[severity];
}

function getHigherSeverity(
    first: Severity,
    second: Severity,
): Severity {
    return getSeverityRank(first) >= getSeverityRank(second)
        ? first
        : second;
}

function hasOppositeRuleTypes(
    first: ConflictRule,
    second: ConflictRule,
): boolean {
    return (
        (first.ruleType === 'MANDATORY' &&
            second.ruleType === 'PROHIBITED') ||
        (first.ruleType === 'PROHIBITED' &&
            second.ruleType === 'MANDATORY')
    );
}

function detectExplicitContradiction(
    first: ConflictRule,
    second: ConflictRule,
): DetectedConflict | null {
    const firstCore = normalizeStatement(first.ruleStatement);
    const secondCore = normalizeStatement(second.ruleStatement);

    if (!firstCore || firstCore !== secondCore) {
        return null;
    }

    const firstPolarity = getPolarity(first.ruleStatement);
    const secondPolarity = getPolarity(second.ruleStatement);

    const oppositePolarity =
        firstPolarity !== null &&
        secondPolarity !== null &&
        firstPolarity !== secondPolarity;

    if (!oppositePolarity && !hasOppositeRuleTypes(first, second)) {
        return null;
    }

    return {
        ruleAId: first.id,
        ruleBId: second.id,
        conflictType: 'CONTRADICTION',
        explanation:
            'Both rules describe the same requirement but express opposite instructions.',
        severity: getHigherSeverity(first.severity, second.severity),
    };
}

export function detectRuleConflicts(
    rules: ConflictRule[],
): DetectedConflict[] {
    const conflicts: DetectedConflict[] = [];

    for (let i = 0; i < rules.length; i += 1) {
        for (let j = i + 1; j < rules.length; j += 1) {
            const first = rules[i];
            const second = rules[j];

            if (!first || !second || first.id === second.id) {
                continue;
            }

            const conflict = detectExplicitContradiction(
                first,
                second,
            );

            if (conflict) {
                conflicts.push(conflict);
            }
        }
    }

    return conflicts;
}
