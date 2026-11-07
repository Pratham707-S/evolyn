export type KnowledgeCategoryId =
  | 'all'
  | 'product-facts'
  | 'evidence-studies'
  | 'approved-claims'
  | 'terminology'
  | 'reference-docs';

export type KnowledgeTypeLabel =
  | 'Product Facts'
  | 'Evidence & Studies'
  | 'Approved Claims'
  | 'Terminology'
  | 'Reference Docs';

export type KnowledgeStatus = 'Approved' | 'In Review' | 'Draft' | 'Deprecated';

export interface KnowledgeCategoryMetric {
  id: KnowledgeCategoryId;
  label: string;
  typeLabel?: KnowledgeTypeLabel;
  count: number;
  iconName: 'book' | 'layers' | 'flask' | 'shield' | 'typography' | 'document';
}

export interface VersionHistoryEntry {
  version: string;
  date: string;
  author: string;
  notes: string;
}

export interface KnowledgeUsageStats {
  linkedSubmissions: number;
  activeRulesCount: number;
  lastUsedReview: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  subtitle: string;
  type: KnowledgeTypeLabel;
  categoryId: KnowledgeCategoryId;
  product: string;
  status: KnowledgeStatus;
  lastUpdated: string;
  updatedAtDate: string;
  ownedBy: string;
  version: string;
  summary: string;
  keyFacts: string[];
  content: string;
  proofSource: string;
  proofSourceUrl?: string;
  usageStats: KnowledgeUsageStats;
  versionHistory: VersionHistoryEntry[];
}

export const INITIAL_KNOWLEDGE_CATEGORIES: KnowledgeCategoryMetric[] = [
  {
    id: 'all',
    label: 'All Resources',
    count: 42,
    iconName: 'book',
  },
  {
    id: 'product-facts',
    label: 'Product Facts',
    typeLabel: 'Product Facts',
    count: 12,
    iconName: 'layers',
  },
  {
    id: 'evidence-studies',
    label: 'Evidence & Studies',
    typeLabel: 'Evidence & Studies',
    count: 8,
    iconName: 'flask',
  },
  {
    id: 'approved-claims',
    label: 'Approved Claims',
    typeLabel: 'Approved Claims',
    count: 10,
    iconName: 'shield',
  },
  {
    id: 'terminology',
    label: 'Terminology',
    typeLabel: 'Terminology',
    count: 6,
    iconName: 'typography',
  },
  {
    id: 'reference-docs',
    label: 'Reference Docs',
    typeLabel: 'Reference Docs',
    count: 6,
    iconName: 'document',
  },
];

export const INITIAL_KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: 'kn-1',
    title: 'Product Capabilities – Core Platform',
    subtitle: 'Official and approved product capabilities...',
    type: 'Product Facts',
    categoryId: 'product-facts',
    product: 'Evolyn Platform',
    status: 'Approved',
    lastUpdated: '2 days ago',
    updatedAtDate: '2026-11-04T10:00:00Z',
    ownedBy: 'Brand Team',
    version: 'v2.1',
    summary:
      "Authoritative and approved details about Evolyn's core platform capabilities, to be used for all marketing and communication content.",
    keyFacts: [
      'AI-powered brand content review and compliance.',
      'Identifies guideline violations, risky claims, and brand inconsistencies.',
      'Provides evidence-backed findings from approved sources.',
      'Supports human review and approval workflows.',
    ],
    content: `## Evolyn Platform Core Architecture

Evolyn is an AI-orchestrated brand governance operating system designed to automate marketing compliance and quality assurance across omni-channel campaigns.

### Primary Capabilities:
1. **Automated Multi-Model Evaluation**: Evaluates copy and creative assets against company-specific brand rules, voice parameters, and legal constraints.
2. **Context-Aware Semantic Grounding**: Cross-references every marketing statement against the centralized brand knowledge graph to prevent hallucinations.
3. **Audit Trail & Decision Governance**: Maintains immutable timestamps, reviewer notes, and version diffs for every approved and rejected creative asset.`,
    proofSource: 'Internal Product Specification Spec-2026-Q4',
    proofSourceUrl: 'https://specs.evolyn.internal/core-platform-v2.1',
    usageStats: {
      linkedSubmissions: 14,
      activeRulesCount: 6,
      lastUsedReview: 'Q4 Product Launch Press Kit (2 hours ago)',
    },
    versionHistory: [
      {
        version: 'v2.1',
        date: '2 days ago',
        author: 'Brand Team (Elena Rostova)',
        notes: 'Refined AI review taxonomy and added support for multi-model governance.',
      },
      {
        version: 'v2.0',
        date: '1 month ago',
        author: 'Product Marketing (Alex Vance)',
        notes: 'Major platform release capability updates and messaging realignment.',
      },
      {
        version: 'v1.0',
        date: '6 months ago',
        author: 'Executive Council',
        notes: 'Initial approved baseline product capabilities store.',
      },
    ],
  },
  {
    id: 'kn-2',
    title: 'Productivity Impact Study (2024)',
    subtitle: 'Third-party study on marketing productivity...',
    type: 'Evidence & Studies',
    categoryId: 'evidence-studies',
    product: 'Evolyn Platform',
    status: 'Approved',
    lastUpdated: '4 days ago',
    updatedAtDate: '2026-11-02T14:30:00Z',
    ownedBy: 'Research & Insights',
    version: 'v1.4',
    summary:
      'Empirical benchmark report conducted by Apex Consulting measuring review turnaround time and compliance acceleration across 120 enterprise marketing teams.',
    keyFacts: [
      '78% reduction in human brand review cycle latency.',
      '94.2% precision on initial regulatory compliance flagging.',
      '3.4x faster time-to-market for omni-channel campaign distribution.',
      'Surveyed 120 Global 2000 marketing leads over 9 months.',
    ],
    content: `## 2024 Enterprise Marketing Productivity Benchmark

Independent analysis conducted by Apex Advisory Group comparing traditional manual legal review against Evolyn-assisted automated pre-flighting.

### Methodology & Sample Size:
- 120 multinational marketing organizations.
- 4,500 campaign submissions tested across LinkedIn, Google Ads, and Executive Press Releases.
- Verified average 78% reduction in turnaround time from brief approval to final sign-off.`,
    proofSource: 'Apex Advisory Benchmark Research Paper #TR-8821',
    proofSourceUrl: 'https://research.apex-benchmarks.com/studies/evolyn-2024',
    usageStats: {
      linkedSubmissions: 22,
      activeRulesCount: 4,
      lastUsedReview: 'Global Case Study Deck (Yesterday)',
    },
    versionHistory: [
      {
        version: 'v1.4',
        date: '4 days ago',
        author: 'Research & Insights (Dr. Miller)',
        notes: 'Re-validated Q3 cohort statistics and added executive summary snippet.',
      },
      {
        version: 'v1.0',
        date: '3 months ago',
        author: 'Research & Insights',
        notes: 'Initial peer-reviewed study ingestion.',
      },
    ],
  },
  {
    id: 'kn-3',
    title: 'Approved Marketing Claims',
    subtitle: 'List of pre-approved and compliant claims...',
    type: 'Approved Claims',
    categoryId: 'approved-claims',
    product: 'All Products',
    status: 'Approved',
    lastUpdated: '5 days ago',
    updatedAtDate: '2026-11-01T09:15:00Z',
    ownedBy: 'Legal & Compliance',
    version: 'v3.0',
    summary:
      'Verified performance and capability claims certified by legal counsel for unconditional use in ad copy, website assets, and social campaigns.',
    keyFacts: [
      'Pre-approved for digital ads, landing pages, and email communications.',
      'Requires exact wording match when referencing speed and benchmark percentiles.',
      'Expiry review cycle every 90 days; currently valid through Q1 2027.',
      'Covers speed, availability (99.95% uptime SLA), and enterprise encryption.',
    ],
    content: `## Master Certified Claims Registry

The following statements are certified for unrestricted commercial use:
1. "Evolyn accelerates brand review cycles by up to 78% without sacrificing compliance integrity."
2. "Enterprise-grade SOC 2 Type II certified infrastructure with zero-retention AI processing."
3. "Real-time guideline enforcement across 10+ digital marketing channels."`,
    proofSource: 'Evolyn Legal Affirmation Memo LG-2026-11',
    proofSourceUrl: 'https://legal.evolyn.internal/certifications/claims-master',
    usageStats: {
      linkedSubmissions: 35,
      activeRulesCount: 9,
      lastUsedReview: 'Landing Page Hero Copy (3 hours ago)',
    },
    versionHistory: [
      {
        version: 'v3.0',
        date: '5 days ago',
        author: 'Legal & Compliance (Sarah Chen, Esq.)',
        notes: 'Updated uptime SLA wording to reflect Q4 infrastructure upgrades.',
      },
      {
        version: 'v2.2',
        date: '2 months ago',
        author: 'Legal & Compliance',
        notes: 'Certified new SOC 2 Type II security audit statement.',
      },
    ],
  },
  {
    id: 'kn-4',
    title: 'Brand Terminology & Definitions',
    subtitle: 'Approved terms, names, and messaging...',
    type: 'Terminology',
    categoryId: 'terminology',
    product: 'Brand',
    status: 'Approved',
    lastUpdated: '6 days ago',
    updatedAtDate: '2026-10-31T11:45:00Z',
    ownedBy: 'Brand Governance',
    version: 'v1.8',
    summary:
      'Standardized lexicon, product naming taxonomy, capitalization rules, and forbidden jargon across all internal and public messaging.',
    keyFacts: [
      'Always capitalize "Evolyn" with title case; never "EVOLYN" or "evolyn".',
      'Use "Brand Governance Operating System" rather than "Content Checker".',
      'Refer to AI feedback as "Findings" and "Recommendations", not "Errors".',
      'Forbidden buzzwords: "disruptive magic", "bulletproof guarantee".',
    ],
    content: `## Official Nomenclature & Lexicon

| Term | Approved Usage | Deprecated / Prohibited |
| :--- | :--- | :--- |
| **Evolyn** | Primary brand identifier (Title Case) | "EvoLyn", "EVOLYN" |
| **Findings** | AI-identified discrepancies requiring review | "Errors", "Mistakes", "Bugs" |
| **Brand Operating System**| Category classification | "AI checker tool", "Bot" |
| **Decision Workspace** | The approval and audit workstation | "Signoff screen" |`,
    proofSource: 'Brand Identity Standards manual Rev 4',
    proofSourceUrl: 'https://brand.evolyn.internal/standards/lexicon',
    usageStats: {
      linkedSubmissions: 41,
      activeRulesCount: 12,
      lastUsedReview: 'LinkedIn Thought Leadership Post (5 hours ago)',
    },
    versionHistory: [
      {
        version: 'v1.8',
        date: '6 days ago',
        author: 'Brand Governance (Marcus Kane)',
        notes: 'Standardized terminology for automated review runs vs human sign-offs.',
      },
      {
        version: 'v1.5',
        date: '2 months ago',
        author: 'Brand Governance',
        notes: 'Added disallowed superlative guidelines.',
      },
    ],
  },
  {
    id: 'kn-5',
    title: 'Brand Overview & Positioning',
    subtitle: 'Core brand narrative, value proposition...',
    type: 'Reference Docs',
    categoryId: 'reference-docs',
    product: 'Brand',
    status: 'Approved',
    lastUpdated: '1 week ago',
    updatedAtDate: '2026-10-30T16:00:00Z',
    ownedBy: 'Executive Leadership',
    version: 'v2.5',
    summary:
      'Foundational narrative outlining Evolyn\'s mission, ideal customer profile (ICP), strategic differentiators, and value pillars.',
    keyFacts: [
      'Mission: Empower modern brands to scale creative velocity without losing integrity.',
      'Target ICP: High-growth B2B SaaS and regulated consumer enterprises.',
      'Key Pillar: Precision-grounded intelligence over generic probabilistic guessing.',
      'Tone: Authoritative, pragmatic, visionary, and respectful.',
    ],
    content: `## Brand Narrative & Positioning Framework

In an era of generative abundance, the bottleneck for modern marketing teams is no longer content production—it is verification, alignment, and brand safety.

Evolyn bridges the gap between creative agility and uncompromising governance. We equip global teams with proactive, verifiable compliance systems that build trust at every consumer touchpoint.`,
    proofSource: 'Executive Board Strategy Doc 2026',
    proofSourceUrl: 'https://brand.evolyn.internal/positioning-v2.5.pdf',
    usageStats: {
      linkedSubmissions: 28,
      activeRulesCount: 5,
      lastUsedReview: 'Keynote Speech Deck (4 days ago)',
    },
    versionHistory: [
      {
        version: 'v2.5',
        date: '1 week ago',
        author: 'Executive Leadership (Claire Sterling)',
        notes: 'Refined enterprise ICP definition and expanded market differentiators.',
      },
      {
        version: 'v2.0',
        date: '3 months ago',
        author: 'Executive Leadership',
        notes: 'Updated value pillars for global expansion phase.',
      },
    ],
  },
  {
    id: 'kn-6',
    title: 'SOC 2 Type II Security & Compliance Whitepaper',
    subtitle: 'Independent third-party cybersecurity and data privacy validation...',
    type: 'Evidence & Studies',
    categoryId: 'evidence-studies',
    product: 'Evolyn Platform',
    status: 'Approved',
    lastUpdated: '1 week ago',
    updatedAtDate: '2026-10-28T09:00:00Z',
    ownedBy: 'InfoSec Team',
    version: 'v1.2',
    summary:
      'Complete security audit results attesting to zero model data retention, end-to-end AES-256 encryption, and SOC 2 Type II compliance.',
    keyFacts: [
      'Customer content is never utilized for LLM training or fine-tuning.',
      'SOC 2 Type II certified with annual surveillance reviews.',
      'Zero-retention architecture ensures confidential marketing briefs remain private.',
      'GDPR, CCPA, and HIPAA compliance ready.',
    ],
    content: `## Enterprise Security Architecture

Evolyn employs tenant-isolated processing pipelines where uploaded creative materials are streamed directly through ephemeral memory buffers and destroyed immediately post-evaluation.

Independent audit performed by Schellman & Company LLC verified complete adherence to Trust Services Criteria for Security and Confidentiality.`,
    proofSource: 'Schellman SOC 2 Type II Final Report 2026',
    proofSourceUrl: 'https://security.evolyn.com/soc2-whitepaper',
    usageStats: {
      linkedSubmissions: 19,
      activeRulesCount: 3,
      lastUsedReview: 'Enterprise Procurement RFP (Yesterday)',
    },
    versionHistory: [
      {
        version: 'v1.2',
        date: '1 week ago',
        author: 'InfoSec Team (David Ross)',
        notes: 'Updated annual audit confirmation letter.',
      },
    ],
  },
  {
    id: 'kn-7',
    title: 'Enterprise Suite Feature Breakdown',
    subtitle: 'Technical capabilities and permissions model for Enterprise SKU...',
    type: 'Product Facts',
    categoryId: 'product-facts',
    product: 'Enterprise Suite',
    status: 'Approved',
    lastUpdated: '2 weeks ago',
    updatedAtDate: '2026-10-22T13:10:00Z',
    ownedBy: 'Product Management',
    version: 'v3.2',
    summary:
      'Detailed feature matrix outlining SSO, custom multi-tier approval chains, workspace segregation, and dedicated inference capacity.',
    keyFacts: [
      'Single Sign-On (SAML 2.0 / Okta / Azure AD) available on Enterprise tiers.',
      'Role-based access control with granular reviewer and approver permissions.',
      'Dedicated private AI clusters with guaranteed p99 response times < 800ms.',
      'Custom webhook triggers and bi-directional CMS integrations.',
    ],
    content: `## Enterprise SKU Capability Specifications

Built for organizations managing multiple subsidiaries and regional brand portfolios. Provides centralized governance policies with decentralized operational workspaces.`,
    proofSource: 'Product Management PRD #ENT-441',
    proofSourceUrl: 'https://specs.evolyn.internal/enterprise-suite',
    usageStats: {
      linkedSubmissions: 11,
      activeRulesCount: 5,
      lastUsedReview: 'Sales Enablement One-Pager (3 days ago)',
    },
    versionHistory: [
      {
        version: 'v3.2',
        date: '2 weeks ago',
        author: 'Product Management',
        notes: 'Added dedicated cluster SLA specifications.',
      },
    ],
  },
  {
    id: 'kn-8',
    title: 'Customer Satisfaction Benchmark (CSAT & NPS)',
    subtitle: 'Quarterly Net Promoter Score and verified customer testimonial data...',
    type: 'Approved Claims',
    categoryId: 'approved-claims',
    product: 'All Products',
    status: 'Approved',
    lastUpdated: '2 weeks ago',
    updatedAtDate: '2026-10-20T17:00:00Z',
    ownedBy: 'Customer Success',
    version: 'v2.0',
    summary:
      'Audited customer satisfaction metrics and verified NPS score of +68 among enterprise brand and marketing operations directors.',
    keyFacts: [
      'Verified Net Promoter Score (NPS) of +68 in Q3 2026 survey.',
      '99.2% customer retention rate across annual multi-year contract base.',
      'Over 500,000 brand assets reviewed with zero critical legal escapes.',
      'G2 High Performer in Content Quality & Governance category.',
    ],
    content: `## Customer Satisfaction & Performance Indices

Quarterly survey conducted across 450 enterprise users revealed a +68 NPS, placing Evolyn in the top percentile of enterprise B2B SaaS applications.`,
    proofSource: 'G2 & UserEvidence Verified Customer Survey Q3 2026',
    proofSourceUrl: 'https://reviews.evolyn.com/customer-study',
    usageStats: {
      linkedSubmissions: 16,
      activeRulesCount: 4,
      lastUsedReview: 'Q4 Investor Relations Deck (Last week)',
    },
    versionHistory: [
      {
        version: 'v2.0',
        date: '2 weeks ago',
        author: 'Customer Success',
        notes: 'Published Q3 survey results.',
      },
    ],
  },
  {
    id: 'kn-9',
    title: 'Mobile App Asset Guidelines & Specs',
    subtitle: 'Approved resolutions, aspect ratios, and touch targets for mobile...',
    type: 'Reference Docs',
    categoryId: 'reference-docs',
    product: 'Mobile App',
    status: 'Approved',
    lastUpdated: '3 weeks ago',
    updatedAtDate: '2026-10-15T11:00:00Z',
    ownedBy: 'Design System Team',
    version: 'v1.1',
    summary:
      'Asset dimensions, vector rendering constraints, and typography scales for mobile campaign assets and push notification banners.',
    keyFacts: [
      'Minimum touch target size of 48x48dp for all interactive creative overlays.',
      'Strict color contrast ratio minimum of 4.5:1 for body copy on mobile viewports.',
      'Export assets in @2x and @3x WebP/SVG formats.',
      'Maximum uncompressed payload weight per creative bundle: 1.8MB.',
    ],
    content: `## Mobile Design Standards & Viewport Constraints

Guidelines for cross-platform iOS and Android marketing banners, in-app notification graphics, and store listing collateral.`,
    proofSource: 'Design System Token Spec DS-MOB-02',
    proofSourceUrl: 'https://design.evolyn.internal/mobile-specs',
    usageStats: {
      linkedSubmissions: 9,
      activeRulesCount: 6,
      lastUsedReview: 'Mobile Push Campaign Copy (5 days ago)',
    },
    versionHistory: [
      {
        version: 'v1.1',
        date: '3 weeks ago',
        author: 'Design System Team',
        notes: 'Updated WebP compression specifications.',
      },
    ],
  },
  {
    id: 'kn-10',
    title: 'Legal Disclaimer Registry & Required Disclosures',
    subtitle: 'Mandatory footnote disclosures and copyright assertions by region...',
    type: 'Reference Docs',
    categoryId: 'reference-docs',
    product: 'Brand',
    status: 'Approved',
    lastUpdated: '3 weeks ago',
    updatedAtDate: '2026-10-14T14:20:00Z',
    ownedBy: 'Legal & Compliance',
    version: 'v4.0',
    summary:
      'Mandatory legal disclaimer footers, copyright strings, and regional regulatory disclosures for US, EU, UK, and APAC distributions.',
    keyFacts: [
      'EU distribution requires visible GDPR data processing disclosure.',
      'Financial performance projections require safe harbor forward-looking statement.',
      'Copyright string: "© 2026 Evolyn Inc. All rights reserved."',
      'Trademarks must include registered trademark symbol (®) on first prominent mention.',
    ],
    content: `## Regulatory Footnote Disclosures

Mandatory regional copy requirements for all publicly published collateral and digital advertising.`,
    proofSource: 'Corporate Legal Affairs Policy CL-109',
    proofSourceUrl: 'https://legal.evolyn.internal/disclaimers-master',
    usageStats: {
      linkedSubmissions: 31,
      activeRulesCount: 8,
      lastUsedReview: 'Annual Report Summary (1 week ago)',
    },
    versionHistory: [
      {
        version: 'v4.0',
        date: '3 weeks ago',
        author: 'Legal & Compliance',
        notes: 'Incorporated updated EU AI Act disclosure wording.',
      },
    ],
  },
];

