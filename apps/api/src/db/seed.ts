import { db, pool } from './index.js';
import { guidelines, guidelineRules, approvedFacts, contentSubmissions } from './schema.js';

async function seed() {
  console.log('🌱 Starting database seed for Evolyn Brand Governance...');

  // 1. Insert Core Brand Guideline
  const [guideline] = await db
    .insert(guidelines)
    .values({
      title: 'Evolyn Global Brand Governance & Regulatory Guardrails',
      category: 'GENERAL',
      version: '2.4',
      rawContent: `Evolyn Global Brand Guidelines v2.4
1. Brand Naming: Always write brand name as 'Evolyn'. Never 'EVOLYN' or 'Evol-yn'.
2. Claims & Regulatory: Never describe products or workflows as 'guaranteed risk-free' or '100% fail-proof'. All performance claims must be accompanied by appropriate disclaimers.
3. Tone: Maintain an authoritative, clear, and empathetic voice. Avoid hyperbolic marketing buzzwords such as 'revolutionary game-changer'.
4. Fact Substantiation: Any metric referencing customer count, uptime, or transaction volume must link directly to an audited internal quarterly report.`,
      status: 'ACTIVE',
    })
    .returning();

  console.log(`✅ Seeded guideline: ${guideline.title} (${guideline.id})`);

  // 2. Insert Guideline Rules
  const insertedRules = await db
    .insert(guidelineRules)
    .values([
      {
        guidelineId: guideline.id,
        ruleType: 'PROHIBITED',
        ruleStatement: "Never use the phrase 'guaranteed risk-free' or '100% fail-proof' in any marketing or external copy.",
        explanation: 'Regulatory compliance forbids absolute risk-free guarantees in financial and enterprise software communications.',
        severity: 'CRITICAL',
        metadata: { category: 'Regulatory Compliance' },
      },
      {
        guidelineId: guideline.id,
        ruleType: 'MANDATORY',
        ruleStatement: "The brand name must always be capitalized as 'Evolyn' (Title Case). Never all-caps 'EVOLYN' or hyphenated 'Evol-yn'.",
        explanation: 'Brand trademark and logo consistency standard across all channels.',
        severity: 'WARNING',
        metadata: { category: 'Brand Identity' },
      },
      {
        guidelineId: guideline.id,
        ruleType: 'MANDATORY',
        ruleStatement: 'All statistical claims regarding uptime, throughput, or enterprise client volume must be substantiated by approved verified facts.',
        explanation: 'Unverified numerical claims pose legal liability and breach marketing truthfulness standards.',
        severity: 'CRITICAL',
        metadata: { category: 'Fact Verification' },
      },
      {
        guidelineId: guideline.id,
        ruleType: 'RECOMMENDED',
        ruleStatement: "Avoid buzzwords such as 'revolutionary', 'game-changing', or 'miraculous'. Use direct, value-focused adjectives instead.",
        explanation: 'Evolyn tone standard prioritizes engineering rigor and grounded credibility over hype.',
        severity: 'SUGGESTION',
        metadata: { category: 'Tone of Voice' },
      },
    ])
    .returning();

  console.log(`✅ Seeded ${insertedRules.length} guideline rules`);

  // 3. Insert Approved Facts
  const insertedFacts = await db
    .insert(approvedFacts)
    .values([
      {
        topic: 'Platform Uptime',
        claimStatement: 'Evolyn achieved 99.98% platform uptime across all production clusters during fiscal year 2025.',
        approvedProofSource: 'SOC 2 Type II Independent Audit Report 2025, Section 4.2',
        validUntil: new Date('2027-12-31'),
      },
      {
        topic: 'Client Count',
        claimStatement: 'Evolyn actively secures brand governance for 45 enterprise customers worldwide.',
        approvedProofSource: 'Q3 2026 Official Shareholder Update, Page 8',
        validUntil: new Date('2027-06-30'),
      },
      {
        topic: 'Security Compliance',
        claimStatement: 'Evolyn is ISO/IEC 27001:2022 and SOC 2 Type II certified.',
        approvedProofSource: 'Global Security & Compliance Registry #EVO-SEC-2025-A',
        validUntil: new Date('2027-01-01'),
      },
    ])
    .returning();

  console.log(`✅ Seeded ${insertedFacts.length} approved facts`);

  // 4. Insert Sample Content Submission
  const [submission] = await db
    .insert(contentSubmissions)
    .values({
      title: 'Q4 Product Launch Announcement (Draft)',
      channel: 'SOCIAL',
      rawText: `Get ready for the revolutionary EVOLYN experience! Our new autonomous governance engine guarantees 100% risk-free compliance for your company with zero human effort. Trusted by over 100 enterprise titans with flawless 100% uptime. Sign up today!`,
      submittedBy: 'Marketing Campaign Team',
      status: 'PENDING',
    })
    .returning();

  console.log(`✅ Seeded sample submission: ${submission.title} (${submission.id})`);

  console.log('🎉 Database seeding completed successfully!');
  await pool.end();
}

seed().catch(async (err) => {
  console.error('❌ Seeding failed:', err);
  await pool.end();
  process.exit(1);
});
