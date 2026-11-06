import { db, pool } from './index.js';
import {
  guidelines,
  guidelineRules,
  approvedFacts,
  contentSubmissions,
  reviewRuns,
  detectedIssues,
  decisions,
} from './schema.js';

async function seed() {
  console.log('🌱 Starting database seed for Evolyn Brand Governance...');

  // 0. Clean old seed records
  await db.delete(decisions);
  await db.delete(detectedIssues);
  await db.delete(reviewRuns);
  await db.delete(contentSubmissions);
  await db.delete(approvedFacts);
  await db.delete(guidelineRules);
  await db.delete(guidelines);

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

  // 4. Insert Sample Content Submissions
  const [pendingSubmission] = await db
    .insert(contentSubmissions)
    .values({
      title: 'Q4 Product Launch Announcement (Draft)',
      channel: 'SOCIAL',
      rawText: `Get ready for the revolutionary EVOLYN experience! Our new autonomous governance engine guarantees 100% risk-free compliance for your company with zero human effort. Trusted by over 100 enterprise titans with flawless 100% uptime. Sign up today!`,
      submittedBy: 'Marketing Campaign Team',
      status: 'PENDING',
    })
    .returning();

  console.log(`✅ Seeded pending submission: ${pendingSubmission.title} (${pendingSubmission.id})`);

  // 5. Insert Reviewed Submission with Findings (for Approvals Queue)
  const [reviewedSubmission] = await db
    .insert(contentSubmissions)
    .values({
      title: 'Enterprise Brand Governance Case Study',
      channel: 'WEBSITE',
      rawText: `Evolyn enables global marketing teams to enforce brand compliance across distributed pipelines. With zero-hallucination guardrails and automated citation verification, review times are cut from days to minutes.`,
      submittedBy: 'Content Editorial Lead',
      status: 'REVIEWED',
    })
    .returning();

  console.log(`✅ Seeded reviewed submission: ${reviewedSubmission.title} (${reviewedSubmission.id})`);

  const [reviewRun] = await db
    .insert(reviewRuns)
    .values({
      submissionId: reviewedSubmission.id,
      overallComplianceScore: 88.5,
      totalIssuesCount: 2,
      modelUsed: 'gemini-3.1-flash-lite',
      summary: {
        passedChecksCount: 4,
        failedChecksCount: 2,
        notes: 'Clear terminology and grounded evidence citations',
      },
    })
    .returning();

  await db.insert(detectedIssues).values([
    {
      reviewRunId: reviewRun.id,
      ruleId: insertedRules[0].id,
      issueType: 'UNSUBSTANTIATED_CLAIM',
      flaggedExcerpt: 'review times are cut from days to minutes',
      explanation: 'Turnaround metric requires substantiation via verified internal case report.',
      suggestedFix: 'review times are reduced by up to 80% based on verified customer benchmarks',
      sourceQuote: "All performance claims must be accompanied by appropriate disclaimers.",
      confidenceScore: 0.94,
      evidenceStrengthScore: 0.85,
      status: 'OPEN',
    },
    {
      reviewRunId: reviewRun.id,
      ruleId: insertedRules[1].id,
      issueType: 'TERMINOLOGY_VIOLATION',
      flaggedExcerpt: 'Evolyn',
      explanation: 'Brand name is correctly capitalized.',
      suggestedFix: 'Evolyn',
      sourceQuote: "The brand name must always be capitalized as 'Evolyn'.",
      confidenceScore: 0.99,
      evidenceStrengthScore: 0.98,
      status: 'OPEN',
    },
  ]);

  console.log(`✅ Seeded review run & 2 detected issues for ${reviewedSubmission.title}`);

  // 6. Insert Approved Submission with Decision History (for Decision History view)
  const [decidedSubmission] = await db
    .insert(contentSubmissions)
    .values({
      title: 'Global SOC 2 Certification Press Release',
      channel: 'PRESS_RELEASE',
      rawText: `Evolyn announced today that it has achieved ISO/IEC 27001:2022 and SOC 2 Type II certification, verifying its enterprise grade security guardrails.`,
      submittedBy: 'PR & Communications Team',
      status: 'APPROVED',
    })
    .returning();

  await db.insert(decisions).values([
    {
      submissionId: decidedSubmission.id,
      decision: 'APPROVED',
      reviewerName: 'Chief Brand Guardian',
      comments: 'Verified claims against official SOC 2 Type II audit report #EVO-SEC-2025-A. All compliance citations valid.',
      overriddenIssueIds: [],
    },
  ]);

  console.log(`✅ Seeded decision history record for ${decidedSubmission.title}`);

  console.log('🎉 Database seeding completed successfully!');
  await pool.end();
}

seed().catch(async (err) => {
  console.error('❌ Seeding failed:', err);
  await pool.end();
  process.exit(1);
});
