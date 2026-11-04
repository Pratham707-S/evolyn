/**
 * ============================================================================
 * SHARED CORE: Single Source of Truth (@evolyn/shared)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNER : Pratham (Project Lead & Architect)
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES & TASKS IN THIS FOLDER:
 * 1. Domain Constants & Enums:
 *    - Rule types (MANDATORY, PROHIBITED, CONDITIONAL, RECOMMENDED).
 *    - Issue severities (CRITICAL, HIGH, MEDIUM, LOW, SUGGESTION).
 *    - Submission statuses & channels.
 * 2. Zod Validation Contracts:
 *    - Shared schemas ensuring strict input contracts between frontend & backend.
 * 3. Inferred TypeScript Types:
 *    - Zero manual type duplication; infer TS interfaces directly from Zod.
 *
 * GUARDRAILS:
 * - Must remain pure TypeScript with zero Node-only or DOM-only runtime dependencies.
 * ============================================================================
 */

export * from './constants/index.js';
export * from './schemas/index.js';
export * from './types/index.js';
export * from './contracts/index.js';
