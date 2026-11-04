/**
 * ============================================================================
 * DATABASE SCHEMA & RELATIONS (apps/api/src/db/schema.ts)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNERS: Pratham (Project Lead & Architect) & Ayan (Backend Lead)
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES & TASKS IN THIS FOLDER:
 * - Define Drizzle ORM PostgreSQL tables with native pgvector (768-dim) support.
 * - Maintain relational foreign keys, cascade deletes, and timestamp triggers.
 * - Tables defined:
 *   1. guidelines & guideline_rules (embedding vector(768)) -> [Mann]
 *   2. guideline_conflicts (cross-rule contradiction pairs) -> [Mann]
 *   3. approved_facts (embedding vector(768) + proof sources) -> [Mann]
 *   4. content_submissions (marketing copy drafts & metadata) -> [Ayan]
 *   5. review_runs (audit executions & timestamps) -> [Ayan & Pratham]
 *   6. detected_issues (verbatim citations & evidence scores) -> [Ayan & Pratham]
 *   7. decisions (immutable human approval sign-offs) -> [Ayan]
 *   8. recurring_mistakes (violation patterns & refinements) -> [Pratham]
 * ============================================================================
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  vector,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// -------------------------------------------------------------
// 1. Guidelines Table
// -------------------------------------------------------------
export const guidelines = pgTable(
  'guidelines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    category: varchar('category', { length: 50 }).notNull().default('GENERAL'),
    version: varchar('version', { length: 20 }).notNull().default('1.0'),
    rawContent: text('raw_content').notNull(),
    s3Url: text('s3_url'),
    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_guidelines_status').on(table.status),
    index('idx_guidelines_category').on(table.category),
  ]
);

// -------------------------------------------------------------
// 2. Guideline Rules Table (Atomic, verifiable brand rules)
// -------------------------------------------------------------
export const guidelineRules = pgTable(
  'guideline_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guidelineId: uuid('guideline_id')
      .notNull()
      .references(() => guidelines.id, { onDelete: 'cascade' }),
    ruleType: varchar('rule_type', { length: 50 }).notNull(), // MANDATORY, PROHIBITED, CONDITIONAL, RECOMMENDED
    ruleStatement: text('rule_statement').notNull(),
    explanation: text('explanation').notNull().default(''),
    severity: varchar('severity', { length: 20 }).notNull().default('WARNING'), // CRITICAL, WARNING, SUGGESTION
    embedding: vector('embedding', { dimensions: 768 }), // Gemini text-embedding-004 dimension
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_rules_guideline_id').on(table.guidelineId),
    index('idx_rules_rule_type').on(table.ruleType),
    index('idx_rules_severity').on(table.severity),
  ]
);

// -------------------------------------------------------------
// 3. Guideline Conflicts Table (Core Innovation 1)
// -------------------------------------------------------------
export const guidelineConflicts = pgTable(
  'guideline_conflicts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ruleAId: uuid('rule_a_id')
      .notNull()
      .references(() => guidelineRules.id, { onDelete: 'cascade' }),
    ruleBId: uuid('rule_b_id')
      .notNull()
      .references(() => guidelineRules.id, { onDelete: 'cascade' }),
    conflictType: varchar('conflict_type', { length: 50 }).notNull(), // CONTRADICTION, AMBIGUITY, OVERLAP
    explanation: text('explanation').notNull(),
    severity: varchar('severity', { length: 20 }).notNull().default('WARNING'),
    status: varchar('status', { length: 20 }).notNull().default('OPEN'), // OPEN, RESOLVED, ACKNOWLEDGED
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_conflicts_rule_a').on(table.ruleAId),
    index('idx_conflicts_rule_b').on(table.ruleBId),
    index('idx_conflicts_status').on(table.status),
  ]
);

// -------------------------------------------------------------
// 4. Approved Facts Table (Ground truth for factual claims)
// -------------------------------------------------------------
export const approvedFacts = pgTable(
  'approved_facts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    topic: varchar('topic', { length: 100 }).notNull(),
    claimStatement: text('claim_statement').notNull(),
    approvedProofSource: text('approved_proof_source').notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    embedding: vector('embedding', { dimensions: 768 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_facts_topic').on(table.topic),
  ]
);

// -------------------------------------------------------------
// 5. Content Submissions Table (Items submitted for review)
// -------------------------------------------------------------
export const contentSubmissions = pgTable(
  'content_submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    channel: varchar('channel', { length: 50 }).notNull().default('WEBSITE'),
    rawText: text('raw_text').notNull(),
    fileUrl: text('file_url'),
    submittedBy: varchar('submitted_by', { length: 100 }).notNull().default('Judge / Reviewer'),
    status: varchar('status', { length: 30 }).notNull().default('PENDING'), // PENDING, ANALYZING, REVIEWED, APPROVED, REJECTED
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_submissions_status').on(table.status),
    index('idx_submissions_created_at').on(table.createdAt),
  ]
);

// -------------------------------------------------------------
// 6. Review Runs Table (Audit record of an AI evaluation)
// -------------------------------------------------------------
export const reviewRuns = pgTable(
  'review_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => contentSubmissions.id, { onDelete: 'cascade' }),
    overallComplianceScore: real('overall_compliance_score').notNull().default(0),
    totalIssuesCount: integer('total_issues_count').notNull().default(0),
    modelUsed: varchar('model_used', { length: 100 }).notNull(),
    summary: jsonb('summary').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_review_runs_submission_id').on(table.submissionId),
  ]
);

// -------------------------------------------------------------
// 7. Detected Issues Table (Flagged violations with citations)
// -------------------------------------------------------------
export const detectedIssues = pgTable(
  'detected_issues',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reviewRunId: uuid('review_run_id')
      .notNull()
      .references(() => reviewRuns.id, { onDelete: 'cascade' }),
    ruleId: uuid('rule_id').references(() => guidelineRules.id, { onDelete: 'set null' }),
    factId: uuid('fact_id').references(() => approvedFacts.id, { onDelete: 'set null' }),
    issueType: varchar('issue_type', { length: 50 }).notNull(),
    flaggedExcerpt: text('flagged_excerpt').notNull(),
    charStart: integer('char_start'),
    charEnd: integer('char_end'),
    explanation: text('explanation').notNull(),
    suggestedFix: text('suggested_fix').notNull().default(''),
    sourceQuote: text('source_quote').notNull(), // Grounded citation: exact quote from brand rules/facts
    confidenceScore: real('confidence_score').notNull().default(1.0),
    evidenceStrengthScore: real('evidence_strength_score').notNull().default(0.0), // Core Innovation 2
    status: varchar('status', { length: 20 }).notNull().default('OPEN'), // OPEN, ACCEPTED, OVERRIDDEN
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_detected_issues_review_run').on(table.reviewRunId),
    index('idx_detected_issues_rule_id').on(table.ruleId),
    index('idx_detected_issues_status').on(table.status),
  ]
);

// -------------------------------------------------------------
// 8. Decisions Table (Final Human Review Decision)
// -------------------------------------------------------------
export const decisions = pgTable(
  'decisions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => contentSubmissions.id, { onDelete: 'cascade' }),
    decision: varchar('decision', { length: 30 }).notNull(), // APPROVED, REJECTED, CHANGES_REQUESTED
    reviewerName: varchar('reviewer_name', { length: 100 }).notNull(),
    comments: text('comments').notNull(),
    overriddenIssueIds: jsonb('overridden_issue_ids').default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_decisions_submission_id').on(table.submissionId),
  ]
);

// -------------------------------------------------------------
// 9. Recurring Mistakes Table (Core Innovation 3)
// -------------------------------------------------------------
export const recurringMistakes = pgTable(
  'recurring_mistakes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => guidelineRules.id, { onDelete: 'cascade' }),
    violationCount: integer('violation_count').notNull().default(1),
    sampleExcerpts: jsonb('sample_excerpts').default([]),
    suggestedGuidelineRevision: text('suggested_guideline_revision'),
    status: varchar('status', { length: 30 }).notNull().default('PENDING_REVIEW'), // PENDING_REVIEW, APPLIED, DISMISSED
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_recurring_mistakes_rule_id').on(table.ruleId),
    index('idx_recurring_mistakes_count').on(table.violationCount),
  ]
);

// -------------------------------------------------------------
// Relations
// -------------------------------------------------------------
export const guidelinesRelations = relations(guidelines, ({ many }) => ({
  rules: many(guidelineRules),
}));

export const guidelineRulesRelations = relations(guidelineRules, ({ one, many }) => ({
  guideline: one(guidelines, {
    fields: [guidelineRules.guidelineId],
    references: [guidelines.id],
  }),
  issues: many(detectedIssues),
  conflictsAsA: many(guidelineConflicts, { relationName: 'ruleA' }),
  conflictsAsB: many(guidelineConflicts, { relationName: 'ruleB' }),
  recurringMistake: one(recurringMistakes, {
    fields: [guidelineRules.id],
    references: [recurringMistakes.ruleId],
  }),
}));

export const guidelineConflictsRelations = relations(guidelineConflicts, ({ one }) => ({
  ruleA: one(guidelineRules, {
    fields: [guidelineConflicts.ruleAId],
    references: [guidelineRules.id],
    relationName: 'ruleA',
  }),
  ruleB: one(guidelineRules, {
    fields: [guidelineConflicts.ruleBId],
    references: [guidelineRules.id],
    relationName: 'ruleB',
  }),
}));

export const approvedFactsRelations = relations(approvedFacts, ({ many }) => ({
  issues: many(detectedIssues),
}));

export const contentSubmissionsRelations = relations(contentSubmissions, ({ many, one }) => ({
  reviewRuns: many(reviewRuns),
  decision: one(decisions, {
    fields: [contentSubmissions.id],
    references: [decisions.submissionId],
  }),
}));

export const reviewRunsRelations = relations(reviewRuns, ({ one, many }) => ({
  submission: one(contentSubmissions, {
    fields: [reviewRuns.submissionId],
    references: [contentSubmissions.id],
  }),
  issues: many(detectedIssues),
}));

export const detectedIssuesRelations = relations(detectedIssues, ({ one }) => ({
  reviewRun: one(reviewRuns, {
    fields: [detectedIssues.reviewRunId],
    references: [reviewRuns.id],
  }),
  rule: one(guidelineRules, {
    fields: [detectedIssues.ruleId],
    references: [guidelineRules.id],
  }),
  fact: one(approvedFacts, {
    fields: [detectedIssues.factId],
    references: [approvedFacts.id],
  }),
}));

export const decisionsRelations = relations(decisions, ({ one }) => ({
  submission: one(contentSubmissions, {
    fields: [decisions.submissionId],
    references: [contentSubmissions.id],
  }),
}));

export const recurringMistakesRelations = relations(recurringMistakes, ({ one }) => ({
  rule: one(guidelineRules, {
    fields: [recurringMistakes.ruleId],
    references: [guidelineRules.id],
  }),
}));
