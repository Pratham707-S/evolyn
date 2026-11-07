import { eq, desc } from 'drizzle-orm';
import { db as defaultDb } from '../../db/index.js';
import { guidelines, guidelineRules } from '../../db/schema.js';
import type { BrandSetup } from '@evolyn/shared';

export interface IBrandSetupRepository {
  findActiveSetup(): Promise<BrandSetup | null>;
  saveSetup(setup: BrandSetup): Promise<BrandSetup>;
}

export const DEFAULT_BRAND_SETUP: BrandSetup = {
  brandName: 'Evolyn',
  industry: 'Marketing Technology',
  description:
    'An AI-powered brand governance platform that helps marketing teams create on-brand, compliant, and evidence-backed content.',
  logoUrl: '',
  primaryColor: '#111111',
  secondaryColor: '#EDE7DE',
  headerFont: 'Instrument Serif',
  bodyFont: 'DM Sans',
  voiceTone: {
    formality: 3,
    boldness: 4,
    accessibility: 4,
    toneDescriptors: ['Authoritative', 'Precise', 'Modern'],
    dos: [
      'Use clear, active voice with quantifiable metrics',
      'Anchor claims to verifiable benchmark studies',
      'Maintain a calm, confident, and professional demeanor',
    ],
    donts: [
      'Never use hyperbole or unsubstantiated superlatives',
      'Do not disparage or directly mock competitors',
      'Avoid overly technical jargon in public marketing copy',
    ],
  },
  governance: {
    approvalStrategy: 'single',
    requireEvidence: true,
    blockCompetitors: true,
    enforcePalette: true,
    brandGuardianEmail: 'guardian@evolyn.ai',
    minComplianceScore: 85,
  },
};

export class BrandSetupRepository implements IBrandSetupRepository {
  constructor(private readonly database = defaultDb) {}

  async findActiveSetup(): Promise<BrandSetup | null> {
    try {
      const records = await this.database
        .select()
        .from(guidelines)
        .where(eq(guidelines.category, 'BRAND_SETUP'))
        .orderBy(desc(guidelines.updatedAt))
        .limit(1);

      if (records.length === 0 || !records[0]?.rawContent) {
        return null;
      }

      try {
        const parsed = JSON.parse(records[0].rawContent) as BrandSetup;
        return parsed;
      } catch {
        return null;
      }
    } catch {
      // In case database is disconnected or mock mode
      return null;
    }
  }

  async saveSetup(setup: BrandSetup): Promise<BrandSetup> {
    const rawContent = JSON.stringify(setup);
    const title = `${setup.brandName} - Brand Setup & Profile`;

    try {
      const existing = await this.database
        .select()
        .from(guidelines)
        .where(eq(guidelines.category, 'BRAND_SETUP'))
        .limit(1);

      let guidelineId: string;

      if (existing.length > 0 && existing[0]?.id) {
        guidelineId = existing[0].id;
        await this.database
          .update(guidelines)
          .set({
            title,
            rawContent,
            updatedAt: new Date(),
          })
          .where(eq(guidelines.id, guidelineId));
      } else {
        const [inserted] = await this.database
          .insert(guidelines)
          .values({
            title,
            category: 'BRAND_SETUP',
            version: '1.0',
            rawContent,
            status: 'ACTIVE',
          })
          .returning();
        guidelineId = inserted.id;
      }

      // Sync atomic voice & positioning rules to guideline_rules table
      try {
        // Delete previous rules for this setup guideline
        await this.database
          .delete(guidelineRules)
          .where(eq(guidelineRules.guidelineId, guidelineId));

        const rulesToInsert = [];

        // Brand naming rule
        rulesToInsert.push({
          guidelineId,
          ruleType: 'MANDATORY',
          ruleStatement: `Brand name must always appear as "${setup.brandName}".`,
          explanation: 'Official Brand Setup name casing and standard.',
          severity: 'CRITICAL',
          metadata: { category: 'Brand Setup', type: 'Naming' },
        });

        // Voice Do rules
        for (const doRule of setup.voiceTone.dos) {
          rulesToInsert.push({
            guidelineId,
            ruleType: 'MANDATORY',
            ruleStatement: doRule,
            explanation: 'Official Brand Voice Directive (Do).',
            severity: 'WARNING',
            metadata: { category: 'Brand Voice', type: 'Do' },
          });
        }

        // Voice Don't rules
        for (const dontRule of setup.voiceTone.donts) {
          rulesToInsert.push({
            guidelineId,
            ruleType: 'PROHIBITED',
            ruleStatement: dontRule,
            explanation: 'Official Brand Voice Restriction (Don\'t).',
            severity: 'CRITICAL',
            metadata: { category: 'Brand Voice', type: 'Dont' },
          });
        }

        if (rulesToInsert.length > 0) {
          await this.database.insert(guidelineRules).values(rulesToInsert);
        }
      } catch {
        // Continue even if rule sync fails
      }

      return setup;
    } catch (err) {
      // In disconnected environment, return the setup
      return setup;
    }
  }
}

export const brandSetupRepository = new BrandSetupRepository();

