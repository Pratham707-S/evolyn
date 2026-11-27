import { createApprovedFactSchema } from '@evolyn/shared';

import type {
    ApprovedFact,
    CreateApprovedFactInput,
} from '@evolyn/shared';

import type { IKnowledgeService, ClaimVerificationResult } from './index.js';

import {
    KnowledgeRepository,
    knowledgeRepository,
} from './knowledge.repository.js';

import type {
    ApprovedFactRecord,
} from './knowledge.repository.js';

import type {
    FactMatchResult,
} from './knowledge.types.js';

import type { FactEmbeddingGenerator } from './knowledge.types.js';
import { defaultMaintenanceGate } from '../maintenance/maintenance-gate.js';

type KnowledgeRepositoryPort = Pick<
    KnowledgeRepository,
    | 'create'
    | 'findMany'
    | 'findById'
    | 'delete'
    | 'findRelevantFacts'
    | 'findFactsWithoutEmbeddings'
    | 'updateEmbedding'
>;

function mapFact(record: ApprovedFactRecord): ApprovedFact {
    return {
        id: record.id,
        topic: record.topic,
        claimStatement: record.claimStatement,
        approvedProofSource: record.approvedProofSource,
        validUntil: record.validUntil?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        metadata: (record.metadata ?? {}) as Record<string, unknown>,
    };
}

export class KnowledgeService implements IKnowledgeService {
    constructor(
        private readonly repository: KnowledgeRepositoryPort,
        private readonly embeddingGenerator?: FactEmbeddingGenerator,
    ) { }

    async createFact(
        input: CreateApprovedFactInput,
    ): Promise<ApprovedFact> {
        const validatedInput = createApprovedFactSchema.parse(input);

        const fact = await this.repository.create(validatedInput);

        return mapFact(fact);
    }

    async listFacts(topic?: string): Promise<ApprovedFact[]> {
        const facts = await this.repository.findMany(topic);

        return facts.map(mapFact);
    }

    async getFactById(id: string): Promise<ApprovedFact | null> {
        if (!id || !id.trim()) {
            throw new Error('Fact ID cannot be empty');
        }

        const fact = await this.repository.findById(id);
        if (!fact) {
            return null;
        }

        return mapFact(fact);
    }

    async deleteFact(id: string): Promise<boolean> {
        if (!id || !id.trim()) {
            throw new Error('Fact ID cannot be empty');
        }

        return await this.repository.delete(id);
    }

    async findRelevantFacts(
        queryVector: number[],
        limit = 10,
    ): Promise<FactMatchResult[]> {
        if (
            !Array.isArray(queryVector) ||
            queryVector.length !== 768 ||
            !queryVector.every(Number.isFinite)
        ) {
            throw new Error(
                'Query embedding must contain exactly 768 finite numbers',
            );
        }

        if (!Number.isInteger(limit) || limit <= 0) {
            throw new Error('Limit must be a positive integer');
        }

        const facts = await this.repository.findRelevantFacts(
            queryVector,
            limit,
        );

        return facts.map((fact) => ({
            ...mapFact(fact),
            similarity: fact.similarity,
        }));
    }

    async verifyClaim(claimText: string): Promise<ClaimVerificationResult> {
        if (!claimText || !claimText.trim()) {
            throw new Error('Claim text cannot be empty');
        }

        const trimmedClaim = claimText.trim();
        const facts = await this.listFacts();

        if (facts.length === 0) {
            return {
                claim: trimmedClaim,
                verdict: 'UNSUBSTANTIATED',
                evidenceStrength: 0.05,
                confidence: 0.95,
                matchedFact: null,
                corroboratingFacts: [],
                verbatimVerification: {
                    isVerbatim: false,
                },
                recommendation: 'No approved corporate facts found in Knowledge Library. Please add verified proof sources before asserting claims.',
                auditTimestamp: new Date().toISOString(),
            };
        }

        const STOP_WORDS = new Set([
            'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'of',
            'for', 'to', 'with', 'by', 'as', 'are', 'was', 'were', 'our', 'we',
            'it', 'this', 'that', 'all', 'be', 'has', 'have', 'had', 'from', 'evolyn',
        ]);

        const HYPERBOLIC_TERMS = ['100%', 'zero-risk', 'infallible', 'guarantees', 'guarantee', 'absolute'];

        const tokenize = (text: string): string[] => {
            return text
                .toLowerCase()
                .replace(/[^a-z0-9.%-]/g, ' ')
                .split(/\s+/)
                .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
        };

        const claimTokens = tokenize(trimmedClaim);
        const claimNumbers = (trimmedClaim.match(/\b\d+(?:\.\d+)?%?/g) || []).map((s) => s.toLowerCase());
        const hasHyperbole = HYPERBOLIC_TERMS.some((h) => trimmedClaim.toLowerCase().includes(h));

        const scoredFacts: Array<ApprovedFact & { score: number; verbatimMatch: string | null }> = [];

        for (const fact of facts) {
            const factContent = `${fact.claimStatement} ${fact.approvedProofSource}`;
            const factTokens = new Set(tokenize(factContent));
            // Compare figures asserted by the fact itself, not dates or section numbers
            // that only appear in the citation.
            const factNumbers = (fact.claimStatement.match(/\b\d+(?:\.\d+)?%?/g) || []).map((s) => s.toLowerCase());

            // 1. Token Jaccard overlap
            const commonTokens = claimTokens.filter((t) => factTokens.has(t));
            let jaccard = claimTokens.length > 0 ? commonTokens.length / (claimTokens.length + factTokens.size - commonTokens.length) : 0;

            // 2. Numeric / statistical match bonus
            let numberMatchCount = 0;
            let hasMismatchedClaimNumber = false;
            for (const num of claimNumbers) {
                if (factNumbers.includes(num)) {
                    numberMatchCount++;
                } else {
                    hasMismatchedClaimNumber = true;
                }
            }

            let score = jaccard * 1.8;

            if (numberMatchCount > 0) {
                score += Math.min(0.5, numberMatchCount * 0.35);
            }

            // 3. Topic match bonus
            const normalizedClaim = trimmedClaim.toLowerCase();
            if (normalizedClaim.includes(fact.topic.toLowerCase())) {
                score += 0.25;
            }

            // 4. Hyperbole penalty
            if (hasHyperbole && !factContent.toLowerCase().includes('100%')) {
                score = Math.max(0.05, score - 0.45);
            }

            // A close text match cannot verify a different numeric assertion.
            // Keep it eligible for PARTIAL_EVIDENCE so the reviewer sees the related source.
            if (hasMismatchedClaimNumber) {
                score = Math.min(score, 0.64);
            }

            // 5. Substring match
            let verbatimMatch: string | null = null;
            const normalizedFact = fact.claimStatement.toLowerCase();

            for (const token of claimTokens) {
                if (token.length >= 4 && normalizedFact.includes(token)) {
                    if (!verbatimMatch) verbatimMatch = token;
                }
            }

            score = Math.min(1.0, Math.max(0.0, score));
            scoredFacts.push({ ...fact, score, verbatimMatch });
        }

        scoredFacts.sort((a, b) => b.score - a.score);

        const bestFact = scoredFacts[0];
        const bestScore = bestFact ? bestFact.score : 0;

        let verdict: 'VERIFIED' | 'PARTIAL_EVIDENCE' | 'UNSUBSTANTIATED' = 'UNSUBSTANTIATED';
        let evidenceStrength = 0.1;
        let recommendation = '';

        if (bestScore >= 0.65) {
            verdict = 'VERIFIED';
            evidenceStrength = Math.min(0.99, Math.max(0.85, bestScore * 1.05));
            recommendation = `Strongly supported by certified corporate records: "${bestFact.approvedProofSource}". Safe to publish with attribution.`;
        } else if (bestScore >= 0.35) {
            verdict = 'PARTIAL_EVIDENCE';
            evidenceStrength = Math.min(0.74, Math.max(0.48, bestScore * 1.1));
            recommendation = `Related factual precedent found in Knowledge Library (${bestFact.topic}), but specific figures or timeline require verification before sign-off.`;
        } else {
            verdict = 'UNSUBSTANTIATED';
            evidenceStrength = Math.max(0.05, Math.min(0.25, bestScore * 0.8));
            recommendation = 'Zero corroborating evidence found in corporate Knowledge Library. High risk of hallucination or non-compliance. Evidence proof required.';
        }

        const isVerbatim = verdict === 'VERIFIED' && Boolean(bestFact.verbatimMatch);

        return {
            claim: trimmedClaim,
            verdict,
            evidenceStrength: Math.round(evidenceStrength * 100) / 100,
            confidence: Math.round((0.85 + (bestScore * 0.12)) * 100) / 100,
            matchedFact: verdict !== 'UNSUBSTANTIATED' && bestFact ? bestFact : null,
            corroboratingFacts: scoredFacts.slice(0, 3).map((f) => ({
                id: f.id,
                topic: f.topic,
                claimStatement: f.claimStatement,
                approvedProofSource: f.approvedProofSource,
                validUntil: f.validUntil,
                createdAt: f.createdAt,
                similarity: Math.round(f.score * 100) / 100,
            })),
            verbatimVerification: {
                isVerbatim,
                proofSource: bestFact?.approvedProofSource,
                citationExcerpt: bestFact?.claimStatement,
            },
            recommendation,
            auditTimestamp: new Date().toISOString(),
        };
    }

    async generateAndSaveEmbeddings(): Promise<number> {
        return await defaultMaintenanceGate.withSharedLock(async () => {
            if (!this.embeddingGenerator) {
                throw new Error('Embedding generator is not configured');
            }

            const facts = await this.repository.findFactsWithoutEmbeddings();

            let generatedCount = 0;

            for (const fact of facts) {
                const embedding = await this.embeddingGenerator.generateEmbedding(
                    fact.claimStatement,
                );

                if (
                    !Array.isArray(embedding) ||
                    embedding.length !== 768 ||
                    !embedding.every(Number.isFinite)
                ) {
                    throw new Error(
                        `Invalid embedding generated for fact: ${fact.id}`,
                    );
                }

                await this.repository.updateEmbedding(fact.id, embedding);
                generatedCount++;
            }

            return generatedCount;
        });
    }

    async seedSampleFacts(): Promise<ApprovedFact[]> {
        const samples: CreateApprovedFactInput[] = [
            {
                topic: 'Platform Uptime',
                claimStatement: 'Evolyn achieved 99.98% platform uptime across all production clusters during fiscal year 2025.',
                approvedProofSource: 'SOC 2 Type II Independent Audit Report 2025, Section 4.2',
                validUntil: '2027-12-31T00:00:00.000Z',
            },
            {
                topic: 'Enterprise Adoption',
                claimStatement: 'Evolyn actively secures brand governance for 45 enterprise customers worldwide.',
                approvedProofSource: 'Q3 2026 Official Shareholder Update, Page 8',
                validUntil: '2027-06-30T00:00:00.000Z',
            },
            {
                topic: 'Security Certifications',
                claimStatement: 'Evolyn is ISO/IEC 27001:2022 and SOC 2 Type II certified.',
                approvedProofSource: 'Global Security & Compliance Registry #EVO-SEC-2025-A',
                validUntil: '2027-01-01T00:00:00.000Z',
            },
            {
                topic: 'Performance Benchmark',
                claimStatement: 'Evolyn Brand Governance Audit executes in under 1.5 seconds for standard enterprise documents.',
                approvedProofSource: 'Q4 2025 Engineering Performance Benchmark Report, Table 3.1',
                validUntil: '2027-12-31T00:00:00.000Z',
            },
        ];

        const existing = await this.listFacts();
        const existingStatements = new Set(existing.map((f) => f.claimStatement));

        const created: ApprovedFact[] = [];
        for (const sample of samples) {
            if (!existingStatements.has(sample.claimStatement)) {
                const fact = await this.createFact(sample);
                created.push(fact);
            }
        }

        return await this.listFacts();
    }
}
export const knowledgeService = new KnowledgeService(
    knowledgeRepository,
);
