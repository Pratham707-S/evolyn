import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { guidelineRules, guidelines, recurringMistakes } from '../../db/schema.js';

export interface EnrichedRecurringMistake {
  id: string;
  ruleId: string;
  violationCount: number;
  sampleExcerpts: string[];
  suggestedGuidelineRevision: string | null;
  status: 'PENDING_REVIEW' | 'APPLIED' | 'DISMISSED';
  createdAt: string;
  updatedAt: string;
  rule: {
    id: string;
    statement: string;
    ruleType: string;
    severity: string;
    explanation: string;
    guidelineId: string;
    guidelineTitle: string;
  };
}

export class InsightsRepository {
  constructor(private readonly database: typeof db = db) {}

  async listAll(status?: string): Promise<EnrichedRecurringMistake[]> {
    const query = this.database
      .select({
        id: recurringMistakes.id,
        ruleId: recurringMistakes.ruleId,
        violationCount: recurringMistakes.violationCount,
        sampleExcerpts: recurringMistakes.sampleExcerpts,
        suggestedGuidelineRevision: recurringMistakes.suggestedGuidelineRevision,
        status: recurringMistakes.status,
        createdAt: recurringMistakes.createdAt,
        updatedAt: recurringMistakes.updatedAt,
        ruleIdCol: guidelineRules.id,
        ruleStatement: guidelineRules.ruleStatement,
        ruleType: guidelineRules.ruleType,
        severity: guidelineRules.severity,
        explanation: guidelineRules.explanation,
        guidelineId: guidelineRules.guidelineId,
        guidelineTitle: guidelines.title,
      })
      .from(recurringMistakes)
      .innerJoin(guidelineRules, eq(recurringMistakes.ruleId, guidelineRules.id))
      .innerJoin(guidelines, eq(guidelineRules.guidelineId, guidelines.id))
      .orderBy(desc(recurringMistakes.violationCount), desc(recurringMistakes.updatedAt));

    const rows = status
      ? await query.where(eq(recurringMistakes.status, status))
      : await query;

    return rows.map((r) => ({
      id: r.id,
      ruleId: r.ruleId,
      violationCount: r.violationCount,
      sampleExcerpts: Array.isArray(r.sampleExcerpts) ? (r.sampleExcerpts as string[]) : [],
      suggestedGuidelineRevision: r.suggestedGuidelineRevision,
      status: r.status as 'PENDING_REVIEW' | 'APPLIED' | 'DISMISSED',
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      rule: {
        id: r.ruleIdCol,
        statement: r.ruleStatement,
        ruleType: r.ruleType,
        severity: r.severity,
        explanation: r.explanation,
        guidelineId: r.guidelineId,
        guidelineTitle: r.guidelineTitle,
      },
    }));
  }

  async findByRuleId(ruleId: string): Promise<EnrichedRecurringMistake | null> {
    const [row] = await this.database
      .select({
        id: recurringMistakes.id,
        ruleId: recurringMistakes.ruleId,
        violationCount: recurringMistakes.violationCount,
        sampleExcerpts: recurringMistakes.sampleExcerpts,
        suggestedGuidelineRevision: recurringMistakes.suggestedGuidelineRevision,
        status: recurringMistakes.status,
        createdAt: recurringMistakes.createdAt,
        updatedAt: recurringMistakes.updatedAt,
        ruleIdCol: guidelineRules.id,
        ruleStatement: guidelineRules.ruleStatement,
        ruleType: guidelineRules.ruleType,
        severity: guidelineRules.severity,
        explanation: guidelineRules.explanation,
        guidelineId: guidelineRules.guidelineId,
        guidelineTitle: guidelines.title,
      })
      .from(recurringMistakes)
      .innerJoin(guidelineRules, eq(recurringMistakes.ruleId, guidelineRules.id))
      .innerJoin(guidelines, eq(guidelineRules.guidelineId, guidelines.id))
      .where(eq(recurringMistakes.ruleId, ruleId))
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
      ruleId: row.ruleId,
      violationCount: row.violationCount,
      sampleExcerpts: Array.isArray(row.sampleExcerpts) ? (row.sampleExcerpts as string[]) : [],
      suggestedGuidelineRevision: row.suggestedGuidelineRevision,
      status: row.status as 'PENDING_REVIEW' | 'APPLIED' | 'DISMISSED',
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      rule: {
        id: row.ruleIdCol,
        statement: row.ruleStatement,
        ruleType: row.ruleType,
        severity: row.severity,
        explanation: row.explanation,
        guidelineId: row.guidelineId,
        guidelineTitle: row.guidelineTitle,
      },
    };
  }

  async recordViolation(ruleId: string, excerpt: string): Promise<void> {
    const existing = await this.findByRuleId(ruleId);

    if (existing) {
      const updatedExcerpts = [...existing.sampleExcerpts, excerpt].slice(-5);
      await this.database
        .update(recurringMistakes)
        .set({
          violationCount: existing.violationCount + 1,
          sampleExcerpts: updatedExcerpts,
          updatedAt: new Date(),
        })
        .where(eq(recurringMistakes.ruleId, ruleId));
    } else {
      await this.database.insert(recurringMistakes).values({
        ruleId,
        violationCount: 1,
        sampleExcerpts: [excerpt],
        status: 'PENDING_REVIEW',
      });
    }
  }

  async updateRevision(ruleId: string, revision: string): Promise<void> {
    await this.database
      .update(recurringMistakes)
      .set({
        suggestedGuidelineRevision: revision,
        updatedAt: new Date(),
      })
      .where(eq(recurringMistakes.ruleId, ruleId));
  }

  async updateStatus(
    ruleId: string,
    status: 'PENDING_REVIEW' | 'APPLIED' | 'DISMISSED'
  ): Promise<void> {
    await this.database
      .update(recurringMistakes)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(recurringMistakes.ruleId, ruleId));
  }

  async applyRefinement(ruleId: string, newStatement: string): Promise<void> {
    // 1. Update guideline rule
    await this.database
      .update(guidelineRules)
      .set({
        ruleStatement: newStatement,
      })
      .where(eq(guidelineRules.id, ruleId));

    // 2. Mark mistake as APPLIED
    await this.database
      .update(recurringMistakes)
      .set({
        status: 'APPLIED',
        updatedAt: new Date(),
      })
      .where(eq(recurringMistakes.ruleId, ruleId));
  }

  async insertOrUpdateMistake(data: {
    ruleId: string;
    violationCount: number;
    sampleExcerpts: string[];
    suggestedGuidelineRevision?: string;
    status?: 'PENDING_REVIEW' | 'APPLIED' | 'DISMISSED';
  }): Promise<void> {
    await this.database
      .insert(recurringMistakes)
      .values({
        ruleId: data.ruleId,
        violationCount: data.violationCount,
        sampleExcerpts: data.sampleExcerpts,
        suggestedGuidelineRevision: data.suggestedGuidelineRevision || null,
        status: data.status || 'PENDING_REVIEW',
      })
      .onConflictDoUpdate({
        target: recurringMistakes.ruleId,
        set: {
          violationCount: data.violationCount,
          sampleExcerpts: data.sampleExcerpts,
          suggestedGuidelineRevision: data.suggestedGuidelineRevision || null,
          status: data.status || 'PENDING_REVIEW',
          updatedAt: new Date(),
        },
      });
  }
}

export const insightsRepository = new InsightsRepository();
