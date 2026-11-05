import { detectedIssueSchema, uuidSchema } from '@evolyn/shared';
import type { DetectedIssue } from '@evolyn/shared';
import type { IFindingsService } from './index.js';
import {
  FindingsRepository,
  findingsRepository,
  type CanonicalSourceRecord,
  type DetectedIssueRecord,
} from './findings.repository.js';
import type { RawFindingInput } from './findings.types.js';

function mapRecord(record: DetectedIssueRecord): DetectedIssue {
  return detectedIssueSchema.parse(record);
}

function getExcerptOffsets(
  finding: RawFindingInput,
  submissionText: string
): { charStart: number; charEnd: number } {
  if (!finding.flaggedExcerpt) {
    throw new Error('A finding must include a non-empty flagged excerpt');
  }

  const hasStart = finding.charStart !== undefined && finding.charStart !== null;
  const hasEnd = finding.charEnd !== undefined && finding.charEnd !== null;

  if (hasStart !== hasEnd) {
    throw new Error('Finding character offsets must include both start and end');
  }

  if (typeof finding.charStart === 'number' && typeof finding.charEnd === 'number') {
    const charStart = finding.charStart;
    const charEnd = finding.charEnd;
    if (
      charStart < 0 ||
      charEnd < charStart ||
      submissionText.slice(charStart, charEnd) !== finding.flaggedExcerpt
    ) {
      throw new Error('Finding character offsets do not match the submitted content');
    }

    return { charStart, charEnd };
  }

  const charStart = submissionText.indexOf(finding.flaggedExcerpt);
  if (charStart < 0) {
    throw new Error('Flagged excerpt was not found in the submitted content');
  }

  return { charStart, charEnd: charStart + finding.flaggedExcerpt.length };
}

export type FindingsRepositoryDependency = Pick<
  FindingsRepository,
  'recordMany' | 'listByReviewRunId'
> & {
  findCanonicalSource?: (source: {
    ruleId?: string | null;
    factId?: string | null;
  }) => Promise<CanonicalSourceRecord | null>;
  reviewRunExists?: (reviewRunId: string) => Promise<boolean>;
};

export class FindingsService implements IFindingsService {
  constructor(
    private readonly repository: FindingsRepositoryDependency = findingsRepository
  ) {}

  verifyVerbatimQuote(quote: string, sourceText: string): boolean {
    return (
      typeof quote === 'string' &&
      quote.trim().length > 0 &&
      typeof sourceText === 'string' &&
      sourceText.includes(quote)
    );
  }

  async recordFindings(
    reviewRunId: string,
    rawFindings: RawFindingInput[],
    submissionText: string
  ): Promise<DetectedIssue[]> {
    const validatedReviewRunId = uuidSchema.parse(reviewRunId);

    const findings: DetectedIssue[] = [];

    for (const finding of rawFindings) {
      const sourceId = finding.ruleId ?? finding.factId;
      if (!sourceId) {
        throw new Error('Finding must specify a valid ruleId or factId for source verification');
      }

      if (typeof this.repository.findCanonicalSource !== 'function') {
        throw new Error('Repository does not support canonical source verification');
      }

      const canonicalSource = await this.repository.findCanonicalSource({
        ruleId: finding.ruleId ?? null,
        factId: finding.factId ?? null,
      });

      if (!canonicalSource) {
        throw new Error(`Unknown or inaccessible source: ${sourceId}`);
      }

      // Ground truth verification: verify quote strictly against canonical stored source content.
      // AI-provided sourceText is never trusted as evidence.
      if (!this.verifyVerbatimQuote(finding.sourceQuote, canonicalSource.content)) {
        throw new Error('Finding source quote is not present verbatim in its trusted source');
      }

      const offsets = getExcerptOffsets(finding, submissionText);
      const parsedIssue = detectedIssueSchema.parse({
        ...finding,
        ...offsets,
        reviewRunId: validatedReviewRunId,
      });

      findings.push(parsedIssue);
    }

    const records = await this.repository.recordMany(findings);
    return records.map(mapRecord);
  }

  async getFindingsByReviewRunId(reviewRunId: string): Promise<DetectedIssue[] | null> {
    const validatedReviewRunId = uuidSchema.parse(reviewRunId);

    if (typeof this.repository.reviewRunExists === 'function') {
      const exists = await this.repository.reviewRunExists(validatedReviewRunId);
      if (!exists) {
        return null;
      }
    }

    const records = await this.repository.listByReviewRunId(validatedReviewRunId);
    return records.map(mapRecord);
  }
}

export const findingsService = new FindingsService(findingsRepository);
