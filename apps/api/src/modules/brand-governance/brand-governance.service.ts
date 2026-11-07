import {
  type BrandGovernanceEvaluation,
  brandGovernanceEvaluateRequestSchema,
} from '@evolyn/shared';
import {
  BrandGovernanceAIProvider,
  type BrandGovernanceContext,
} from '../../infrastructure/ai/brand-governance.provider.js';
import {
  brandSetupRepository,
  DEFAULT_BRAND_SETUP,
  type IBrandSetupRepository,
} from '../brand-setup/brand-setup.repository.js';
import {
  guidelinesRepository,
  type GuidelinesRepository,
} from '../guidelines/guidelines.repository.js';
import {
  knowledgeRepository,
  type KnowledgeRepository,
} from '../knowledge/knowledge.repository.js';

export interface IBrandGovernanceService {
  getGovernanceContext(): Promise<BrandGovernanceContext>;
  evaluateContent(input: unknown): Promise<BrandGovernanceEvaluation>;
}

export class BrandGovernanceService implements IBrandGovernanceService {
  constructor(
    private readonly aiProvider?: BrandGovernanceAIProvider,
    private readonly brandSetupRepo: IBrandSetupRepository = brandSetupRepository,
    private readonly guidelinesRepo: GuidelinesRepository = guidelinesRepository,
    private readonly knowledgeRepo: KnowledgeRepository = knowledgeRepository
  ) {}

  private getProvider(): BrandGovernanceAIProvider {
    if (this.aiProvider) {
      return this.aiProvider;
    }
    return new BrandGovernanceAIProvider();
  }

  async getGovernanceContext(): Promise<BrandGovernanceContext> {
    // 1. Brand Setup context from live database
    const setupRecord = await this.brandSetupRepo.findActiveSetup();
    const brandSetup = setupRecord || DEFAULT_BRAND_SETUP;

    // 2. Guidelines rules from live database (bounded to top active rules)
    const rules: BrandGovernanceContext['rules'] = [];
    try {
      const allGuidelines = await this.guidelinesRepo.findMany();
      for (const g of allGuidelines) {
        if (rules.length >= 30) break;
        const gRules = await this.guidelinesRepo.findRulesByGuidelineId(g.id);
        for (const r of gRules) {
          if (rules.length >= 30) break;
          rules.push({
            id: r.id,
            ruleType: r.ruleType,
            ruleStatement: r.ruleStatement,
            severity: r.severity,
            explanation: r.explanation,
          });
        }
      }
    } catch {
      // Offline fallback: keep rules empty
    }

    // 3. Approved facts from live database (bounded to top verified facts)
    const facts: BrandGovernanceContext['facts'] = [];
    try {
      const allFacts = await this.knowledgeRepo.findMany();
      for (const f of allFacts) {
        if (facts.length >= 25) break;
        facts.push({
          id: f.id,
          topic: f.topic,
          claimStatement: f.claimStatement,
          approvedProofSource: f.approvedProofSource,
        });
      }
    } catch {
      // Offline fallback: keep facts empty
    }

    const isBrandSetupComplete = Boolean(
      setupRecord && setupRecord.brandName && setupRecord.brandName.trim()
    );
    const isGuidelinesComplete = rules.length > 0;
    const isKnowledgeLibraryComplete = facts.length > 0;
    const isFullyConfigured =
      isBrandSetupComplete && isGuidelinesComplete && isKnowledgeLibraryComplete;

    let nextIncompleteStep:
      | 'brand-setup'
      | 'guidelines'
      | 'knowledge-library'
      | 'ready' = 'ready';
    if (!isBrandSetupComplete) {
      nextIncompleteStep = 'brand-setup';
    } else if (!isGuidelinesComplete) {
      nextIncompleteStep = 'guidelines';
    } else if (!isKnowledgeLibraryComplete) {
      nextIncompleteStep = 'knowledge-library';
    }

    return {
      brandSetup: {
        brandName: brandSetup.brandName,
        description: brandSetup.description,
        industry: brandSetup.industry,
        voiceTone: brandSetup.voiceTone,
        governance: brandSetup.governance,
      },
      rules,
      facts,
      setupProgress: {
        isBrandSetupComplete,
        isGuidelinesComplete,
        isKnowledgeLibraryComplete,
        isFullyConfigured,
        nextIncompleteStep,
      },
    };
  }

  async evaluateContent(input: unknown): Promise<BrandGovernanceEvaluation> {
    const validated = brandGovernanceEvaluateRequestSchema.parse(input);
    const context = await this.getGovernanceContext();

    const provider = this.getProvider();
    const evaluation = await provider.evaluateContent({
      content: validated.content,
      context,
    });

    return evaluation;
  }
}

export const brandGovernanceService = new BrandGovernanceService();
