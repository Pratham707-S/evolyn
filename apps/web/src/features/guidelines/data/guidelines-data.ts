export interface GuidelineCategoryItem {
  id: string;
  name: string;
  description: string;
  iconName: 'megaphone' | 'target' | 'layers' | 'restrictions' | 'visual';
  count: number;
}

export type GuidelineItemStatus = 'Active' | 'Needs Review' | 'Draft' | 'Archived';
export type GuidelineSeverity = 'CRITICAL' | 'WARNING' | 'SUGGESTION';

export interface GuidelineItem {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  status: GuidelineItemStatus;
  updatedAt: string;
  severity: GuidelineSeverity;
  ruleStatement?: string;
}

export const INITIAL_CATEGORIES: GuidelineCategoryItem[] = [
  {
    id: 'tone-voice',
    name: 'Tone & Voice',
    description: 'Guidelines that define how your brand communicates.',
    iconName: 'megaphone',
    count: 6,
  },
  {
    id: 'messaging',
    name: 'Messaging',
    description: 'Core brand messaging, value propositions, and positioning frameworks.',
    iconName: 'target',
    count: 5,
  },
  {
    id: 'claims-evidence',
    name: 'Claims & Evidence',
    description: 'Mandatory verification rules and citations for performance claims and metrics.',
    iconName: 'layers',
    count: 4,
  },
  {
    id: 'restrictions',
    name: 'Restrictions',
    description: 'Prohibited terms, competitor naming rules, and legal exclusion boundaries.',
    iconName: 'restrictions',
    count: 4,
  },
  {
    id: 'visual-assets',
    name: 'Visual & Assets',
    description: 'Visual identity tokens, logo clearspace, color palettes, and typography rules.',
    iconName: 'visual',
    count: 5,
  },
];

export const INITIAL_GUIDELINES: GuidelineItem[] = [
  // Tone & Voice (6)
  {
    id: 'g-tv-1',
    categoryId: 'tone-voice',
    categoryName: 'Tone & Voice',
    title: 'Use a confident, clear, and helpful tone',
    description: 'Our communication should be confident, easy to understand, and solution-focused.',
    status: 'Active',
    updatedAt: 'Updated 2d ago',
    severity: 'WARNING',
    ruleStatement: 'Write with direct verbs and positive, constructive guidance. Avoid timid phrasing.',
  },
  {
    id: 'g-tv-2',
    categoryId: 'tone-voice',
    categoryName: 'Tone & Voice',
    title: 'Keep the language simple and accessible',
    description: 'Avoid jargon and overly technical terms unless the audience is technical.',
    status: 'Active',
    updatedAt: 'Updated 2d ago',
    severity: 'SUGGESTION',
    ruleStatement: 'Ensure general audience copy maintains a grade 8-10 readability score.',
  },
  {
    id: 'g-tv-3',
    categoryId: 'tone-voice',
    categoryName: 'Tone & Voice',
    title: 'Be factual and evidence-backed',
    description: 'All product or performance claims must be supported by approved evidence.',
    status: 'Active',
    updatedAt: 'Updated 5d ago',
    severity: 'CRITICAL',
    ruleStatement: 'Every factual claim must cite an approved benchmark in the Knowledge Library.',
  },
  {
    id: 'g-tv-4',
    categoryId: 'tone-voice',
    categoryName: 'Tone & Voice',
    title: 'Avoid exaggerated or absolute claims',
    description: 'Do not use words like "always", "100%", "guaranteed" unless officially approved.',
    status: 'Needs Review',
    updatedAt: 'Updated 6d ago',
    severity: 'CRITICAL',
    ruleStatement: 'Absolute superlatives require prior legal sign-off and documented proof.',
  },
  {
    id: 'g-tv-5',
    categoryId: 'tone-voice',
    categoryName: 'Tone & Voice',
    title: 'Write for a professional audience',
    description: 'Maintain a professional, respectful, and brand-aligned tone across all channels.',
    status: 'Active',
    updatedAt: 'Updated 1w ago',
    severity: 'WARNING',
    ruleStatement: 'Avoid internet slang, excessive emojis, and informal banter in B2B copy.',
  },
  {
    id: 'g-tv-6',
    categoryId: 'tone-voice',
    categoryName: 'Tone & Voice',
    title: 'Keep it positive and brand-safe',
    description: 'Focus on value, impact, and possibilities. Avoid negative or risk-heavy language.',
    status: 'Active',
    updatedAt: 'Updated 1w ago',
    severity: 'WARNING',
    ruleStatement: 'Frame challenges around solutions and potential rather than fear or anxiety.',
  },

  // Messaging (5)
  {
    id: 'g-msg-1',
    categoryId: 'messaging',
    categoryName: 'Messaging',
    title: 'Lead with customer value before product features',
    description: 'Structure messaging around customer outcomes, ROI, and workflow improvements.',
    status: 'Active',
    updatedAt: 'Updated 3d ago',
    severity: 'WARNING',
    ruleStatement: 'Highlight business impact in headline and opening paragraph before technical details.',
  },
  {
    id: 'g-msg-2',
    categoryId: 'messaging',
    categoryName: 'Messaging',
    title: 'Position Evolyn as an intelligence layer',
    description: 'Emphasize adaptive governance rather than restrictive policing.',
    status: 'Active',
    updatedAt: 'Updated 4d ago',
    severity: 'SUGGESTION',
    ruleStatement: 'Describe governance as an enabler of speed and creative brand safety.',
  },
  {
    id: 'g-msg-3',
    categoryId: 'messaging',
    categoryName: 'Messaging',
    title: 'Align CTA with buyer lifecycle stage',
    description: 'Top-of-funnel content must use exploratory CTAs ("Explore Guide", "Learn More").',
    status: 'Active',
    updatedAt: 'Updated 1w ago',
    severity: 'SUGGESTION',
    ruleStatement: 'Do not force hard sales CTAs on awareness content.',
  },
  {
    id: 'g-msg-4',
    categoryId: 'messaging',
    categoryName: 'Messaging',
    title: 'Standardize product naming architecture',
    description: 'Refer to core AI review tools with approved product taxonomy.',
    status: 'Needs Review',
    updatedAt: 'Updated 1w ago',
    severity: 'CRITICAL',
    ruleStatement: 'Always capitalize official product modules and never abbreviate without prior approval.',
  },
  {
    id: 'g-msg-5',
    categoryId: 'messaging',
    categoryName: 'Messaging',
    title: 'Maintain localized messaging consistency',
    description: 'Adapt regional taglines while preserving core brand promise.',
    status: 'Active',
    updatedAt: 'Updated 2w ago',
    severity: 'WARNING',
    ruleStatement: 'Ensure translations receive local market brand guardian approval.',
  },

  // Claims & Evidence (4)
  {
    id: 'g-ce-1',
    categoryId: 'claims-evidence',
    categoryName: 'Claims & Evidence',
    title: 'Quantified metrics require source linkage',
    description: 'Every percentage or speed claim must link to an audited benchmark in Knowledge Library.',
    status: 'Active',
    updatedAt: 'Updated 1d ago',
    severity: 'CRITICAL',
    ruleStatement: 'Numeric metrics without linked citation will trigger an automated review flag.',
  },
  {
    id: 'g-ce-2',
    categoryId: 'claims-evidence',
    categoryName: 'Claims & Evidence',
    title: 'Comparative performance claims verification',
    description: 'Direct competitor comparisons require 3rd party verified test results within 90 days.',
    status: 'Active',
    updatedAt: 'Updated 3d ago',
    severity: 'CRITICAL',
    ruleStatement: 'Do not publish comparative speed or accuracy claims without lab audit reports.',
  },
  {
    id: 'g-ce-3',
    categoryId: 'claims-evidence',
    categoryName: 'Claims & Evidence',
    title: 'Customer testimonial attribution standard',
    description: 'Quotes must include verified customer name, verified role, and company name.',
    status: 'Active',
    updatedAt: 'Updated 5d ago',
    severity: 'WARNING',
    ruleStatement: 'Anonymous customer testimonials are prohibited in case studies and whitepapers.',
  },
  {
    id: 'g-ce-4',
    categoryId: 'claims-evidence',
    categoryName: 'Claims & Evidence',
    title: 'Annual report & financial claim auditing',
    description: 'Financial stats must reference current audited fiscal year statements.',
    status: 'Needs Review',
    updatedAt: 'Updated 2w ago',
    severity: 'CRITICAL',
    ruleStatement: 'Quarterly financial metrics must cite official investor relations releases.',
  },

  // Restrictions (4)
  {
    id: 'g-res-1',
    categoryId: 'restrictions',
    categoryName: 'Restrictions',
    title: 'Prohibited competitor naming in ad copy',
    description: 'Never name direct competitors in sponsored ads without explicit legal clearance.',
    status: 'Active',
    updatedAt: 'Updated 1d ago',
    severity: 'CRITICAL',
    ruleStatement: 'Paid advertising copy must not invoke competitor trademarks or names.',
  },
  {
    id: 'g-res-2',
    categoryId: 'restrictions',
    categoryName: 'Restrictions',
    title: 'No unverified superlatives',
    description: 'Avoid terms like "#1 in market", "the best platform", or "unbeatable" without certification.',
    status: 'Active',
    updatedAt: 'Updated 4d ago',
    severity: 'CRITICAL',
    ruleStatement: 'Superlatives without third-party industry rankings (Gartner, Forrester) are rejected.',
  },
  {
    id: 'g-res-3',
    categoryId: 'restrictions',
    categoryName: 'Restrictions',
    title: 'Copyright and trademark protection guidelines',
    description: 'Always include proper trademark symbols on first mention in long-form assets.',
    status: 'Active',
    updatedAt: 'Updated 1w ago',
    severity: 'WARNING',
    ruleStatement: 'Include registered trademark symbols on first body copy mention.',
  },
  {
    id: 'g-res-4',
    categoryId: 'restrictions',
    categoryName: 'Restrictions',
    title: 'Privacy and PII data disclosure ban',
    description: 'Never include identifiable customer data or internal API keys in review samples.',
    status: 'Active',
    updatedAt: 'Updated 3w ago',
    severity: 'CRITICAL',
    ruleStatement: 'All demo datasets and customer screenshots must be thoroughly anonymized.',
  },

  // Visual & Assets (5)
  {
    id: 'g-va-1',
    categoryId: 'visual-assets',
    categoryName: 'Visual & Assets',
    title: 'Maintain minimum logo clearspace',
    description: 'Logos must maintain clearspace equal to the height of the brand icon.',
    status: 'Active',
    updatedAt: 'Updated 2d ago',
    severity: 'WARNING',
    ruleStatement: 'Do not position typography or graphics within the specified clearance perimeter.',
  },
  {
    id: 'g-va-2',
    categoryId: 'visual-assets',
    categoryName: 'Visual & Assets',
    title: 'Strict adherence to primary palette',
    description: 'Digital materials must use approved primary black (#111111) and warm secondary (#EDE7DE).',
    status: 'Active',
    updatedAt: 'Updated 4d ago',
    severity: 'CRITICAL',
    ruleStatement: 'Non-brand color tints must be approved by the design operations team.',
  },
  {
    id: 'g-va-3',
    categoryId: 'visual-assets',
    categoryName: 'Visual & Assets',
    title: 'Typography hierarchy enforcement',
    description: 'Use Instrument Serif for editorial display and DM Sans for interface and body.',
    status: 'Active',
    updatedAt: 'Updated 1w ago',
    severity: 'WARNING',
    ruleStatement: 'Headings must use Instrument Serif; interface labels and paragraphs use DM Sans.',
  },
  {
    id: 'g-va-4',
    categoryId: 'visual-assets',
    categoryName: 'Visual & Assets',
    title: 'Approved photography art direction',
    description: 'Use natural light, candid human interaction, and authentic work environments.',
    status: 'Needs Review',
    updatedAt: 'Updated 1w ago',
    severity: 'SUGGESTION',
    ruleStatement: 'Avoid generic stock photography with exaggerated studio expressions.',
  },
  {
    id: 'g-va-5',
    categoryId: 'visual-assets',
    categoryName: 'Visual & Assets',
    title: 'Iconography grid and line-weight consistency',
    description: 'Use 1.5px to 2px stroke weight with rounded terminals for UI icons.',
    status: 'Active',
    updatedAt: 'Updated 2w ago',
    severity: 'SUGGESTION',
    ruleStatement: 'Icons must be rendered on a 24x24 px pixel-aligned grid.',
  },
];

