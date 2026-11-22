import { db } from '../../db/index.js';
import { guidelineRules } from '../../db/schema.js';
import type { IInsightsService } from './index.js';
import {
  insightsRepository,
  type EnrichedRecurringMistake,
  type InsightsRepository,
  type GovernanceAnalyticsSummary,
} from './insights.repository.js';
import type { RuleRefinementSuggestion } from './insights.types.js';

export class InsightsService implements IInsightsService {
  constructor(private readonly repository: InsightsRepository = insightsRepository) {}

  async trackViolation(ruleId: string, sampleExcerpt: string): Promise<void> {
    if (!ruleId || !ruleId.trim()) return;
    await this.repository.recordViolation(ruleId, sampleExcerpt || 'Flagged content violation');
  }

  async listRecurringMistakes(status?: string): Promise<EnrichedRecurringMistake[]> {
    return await this.repository.listAll(status);
  }

  async getAnalytics(): Promise<GovernanceAnalyticsSummary> {
    return await this.repository.getAnalyticsSummary();
  }

  async generateRefinement(ruleId: string): Promise<RuleRefinementSuggestion> {
    const mistake = await this.repository.findByRuleId(ruleId);
    if (!mistake) {
      throw new Error(`Recurring mistake not found for rule ID: ${ruleId}`);
    }

    const { rule, sampleExcerpts, violationCount } = mistake;
    const originalStatement = rule.statement;

    // Synthesize refined rule wording with concrete DO / DON'T guardrails
    let suggestedRevision = originalStatement;
    let rationale = '';

    if (originalStatement.toLowerCase().includes('tone') || originalStatement.toLowerCase().includes('voice')) {
      suggestedRevision = `${originalStatement.replace(/\.$/, '')}. (DO: Use warm conversational greeting and active verbs. DON'T: Use slang, memes, or informal abbreviations).`;
      rationale = `Synthesized from ${violationCount} recurring violations where writers mixed casual colloquialisms with professional copy. Added explicit DO / DON'T guardrails.`;
    } else if (originalStatement.toLowerCase().includes('claim') || originalStatement.toLowerCase().includes('statistic')) {
      suggestedRevision = `${originalStatement.replace(/\.$/, '')}. Every claim must explicitly cite its Knowledge Library source title and section number.`;
      rationale = `Observed ${violationCount} repeated submissions with uncited stats. Clarified mandatory citation format requirement.`;
    } else if (originalStatement.toLowerCase().includes('prohibit') || originalStatement.toLowerCase().includes('never') || originalStatement.toLowerCase().includes('banned')) {
      suggestedRevision = `${originalStatement.replace(/\.$/, '')} (Applies across all external marketing copy, blogs, and social posts without channel exception).`;
      rationale = `Resolved frequent writer confusion regarding channel-specific exceptions across ${violationCount} flagged drafts.`;
    } else {
      suggestedRevision = `Mandatory Standard: ${originalStatement.replace(/\.$/, '')}. Adherence is verified against corporate style guidelines.`;
      rationale = `Strengthened governance clarity based on ${violationCount} automated review flags.`;
    }

    await this.repository.updateRevision(ruleId, suggestedRevision);

    return {
      ruleId,
      originalStatement,
      suggestedRevision,
      rationale,
      violationCount,
    };
  }

  async applyRefinement(ruleId: string, newStatement: string): Promise<void> {
    if (!ruleId || !newStatement || !newStatement.trim()) {
      throw new Error('ruleId and newStatement are required to apply guideline refinement');
    }

    await this.repository.applyRefinement(ruleId, newStatement.trim());
  }

  async dismissMistake(ruleId: string): Promise<void> {
    if (!ruleId) throw new Error('ruleId is required');
    await this.repository.updateStatus(ruleId, 'DISMISSED');
  }

  async seedDemoRecurringMistakes(): Promise<EnrichedRecurringMistake[]> {
    // 1. Fetch live guideline rules from DB
    const allRules = await db.select().from(guidelineRules).limit(10);

    if (allRules.length === 0) {
      throw new Error('No guideline rules found in database to associate recurring mistakes.');
    }

    // Rule 1: Tone/Voice or first rule
    const rule1 = allRules[0];
    await this.repository.insertOrUpdateMistake({
      ruleId: rule1.id,
      violationCount: 5,
      sampleExcerpts: [
        'Hey guys, grab this crazy discount rn before it vanishes!',
        'Super hyped to announce our sick new AI update yall!',
        'No cap, this is the most cracked governance software ever built.',
      ],
      suggestedGuidelineRevision: `${rule1.ruleStatement.replace(/\.$/, '')}. (DO: Use warm conversational greetings. DON'T: Use slang, internet acronyms, or informal hyperboles).`,
      status: 'PENDING_REVIEW',
    });

    // Rule 2 if available
    if (allRules.length > 1) {
      const rule2 = allRules[1];
      await this.repository.insertOrUpdateMistake({
        ruleId: rule2.id,
        violationCount: 4,
        sampleExcerpts: [
          'Our platform is 100% infallible and guarantees absolute zero compliance risk.',
          'Experience guaranteed 100% bug-free automation with zero errors.',
        ],
        suggestedGuidelineRevision: `${rule2.ruleStatement.replace(/\.$/, '')}. Absolute terms like "100%" or "guaranteed risk-free" are strictly prohibited without independent third-party audit citations.`,
        status: 'PENDING_REVIEW',
      });
    }

    // Rule 3 if available
    if (allRules.length > 2) {
      const rule3 = allRules[2];
      await this.repository.insertOrUpdateMistake({
        ruleId: rule3.id,
        violationCount: 3,
        sampleExcerpts: [
          'We processed over 10 million documents last month according to our team.',
          'Platform provides 99.9% uptime according to internal stats.',
        ],
        suggestedGuidelineRevision: `${rule3.ruleStatement.replace(/\.$/, '')}. All metrics must cite certified reports from the Knowledge Library (e.g. SOC-2 Section 4.2).`,
        status: 'PENDING_REVIEW',
      });
    }

    return await this.repository.listAll();
  }
}

export const insightsService = new InsightsService();
