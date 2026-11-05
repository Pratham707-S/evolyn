export const GUIDELINE_CATEGORIES = [
  'TONE',
  'TERMINOLOGY',
  'CLAIMS',
  'VISUAL',
  'LEGAL',
  'GENERAL',
] as const;

export const GUIDELINE_STATUSES = ['ACTIVE', 'ARCHIVED', 'DRAFT'] as const;

export const RULE_TYPES = [
  'MANDATORY',
  'PROHIBITED',
  'CONDITIONAL',
  'RECOMMENDED',
] as const;

export const SEVERITY_LEVELS = ['CRITICAL', 'WARNING', 'SUGGESTION'] as const;

export const SUBMISSION_CHANNELS = [
  'SOCIAL',
  'PRESS_RELEASE',
  'BLOG',
  'AD_COPY',
  'WEBSITE',
  'EMAIL',
  'OTHER',
] as const;

export const SUBMISSION_STATUSES = [
  'PENDING',
  'ANALYZING',
  'REVIEWED',
  'APPROVED',
  'REJECTED',
] as const;

export const ISSUE_TYPES = [
  'TERMINOLOGY_VIOLATION',
  'UNSUBSTANTIATED_CLAIM',
  'TONE_MISMATCH',
  'PROHIBITED_PHRASE',
  'COMPLIANCE_RISK',
] as const;

export const ISSUE_STATUSES = ['OPEN', 'ACCEPTED', 'OVERRIDDEN'] as const;

export const DECISION_TYPES = [
  'APPROVED',
  'REJECTED',
  'CHANGES_REQUESTED',
] as const;

export const CONFLICT_TYPES = [
  'CONTRADICTION',
  'AMBIGUITY',
  'OVERLAP',
] as const;

export const CONFLICT_STATUSES = ['OPEN', 'RESOLVED', 'ACKNOWLEDGED'] as const;

export const REWRITE_ACTIONS = [
  'IMPROVE_WRITING',
  'GRAMMAR_SPELLING',
  'MAKE_SHORTER',
  'MAKE_LONGER',
  'SIMPLIFY',
  'CHANGE_TONE',
  'HUMANIZE',
  'SUMMARIZE',
] as const;
