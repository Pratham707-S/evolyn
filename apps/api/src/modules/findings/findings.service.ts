import { detectedIssueSchema, uuidSchema } from '@evolyn/shared';
import type { DetectedIssue } from '@evolyn/shared';
import type { IFindingsService } from './index.js';
import {
  FindingsRepository,
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

  if (hasStart && hasEnd) {
    const { charStart, charEnd } = finding;
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

export class FindingsService implements IFindingsService {
  constructor(
    private readonly repository: Pick<
      FindingsRepository,
      'recordMany' | 'listByReviewRunId'
    > = new FindingsRepository()
  ) {}

  verifyVerbatimQuote(quote: string, sourceText: string): boolean {
    return quote.length > 0 && sourceText.includes(quote);
  }

  async recordFindings(
    reviewRunId: string,
    rawFindings: RawFindingInput[],
    submissionText: string
  ): Promise<DetectedIssue[]> {
    const validatedReviewRunId = uuidSchema.parse(reviewRunId);
    const findings = rawFindings.map((finding) => {
      if (!this.verifyVerbatimQuote(finding.sourceQuote, finding.sourceText)) {
        throw new Error('Finding source quote is not present verbatim in its source');
      }

      const offsets = getExcerptOffsets(finding, submissionText);
      return detectedIssueSchema.parse({
        ...finding,
        ...offsets,
        reviewRunId: validatedReviewRunId,
      });
    });

    const records = await this.repository.recordMany(findings);
    return records.map(mapRecord);
  }

  async getFindingsByReviewRunId(reviewRunId: string): Promise<DetectedIssue[]> {
    const validatedReviewRunId = uuidSchema.parse(reviewRunId);
    const records = await this.repository.listByReviewRunId(validatedReviewRunId);
    return records.map(mapRecord);
  }
}
