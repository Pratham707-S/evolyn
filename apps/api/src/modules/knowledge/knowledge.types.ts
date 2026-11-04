import type { ApprovedFact } from '@evolyn/shared';

export interface FactMatchResult extends ApprovedFact {
  similarity: number;
}
