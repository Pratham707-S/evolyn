/**
 * ============================================================================
 * FEATURE: Platform Dashboard & Workflow Stepper (apps/web/src/features/dashboard)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNER : Pratham Kave (Frontend Lead)
 * REVIEWER       : Pratham (Project Lead & Architect)
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES & TASKS IN THIS FOLDER:
 * 1. Overview Dashboard UI:
 *    - Render brand governance health metrics (total audits, approval rate, active guidelines).
 * 2. 5-Step Core Judge Workflow Stepper:
 *    - Interactive visual stepper showcasing:
 *      Step 1: Add / Upload Guidelines
 *      Step 2: Submit Content for Review
 *      Step 3: Verify Against Rules & Approved Facts
 *      Step 4: Inspect Issues with Verbatim Citations
 *      Step 5: Make Human Approval / Rejection Decision
 * 3. Quick Action Launchers:
 *    - Direct entry points to upload guideline, submit new draft, or resume pending audits.
 *
 * GUARDRAILS & CONTRACTS:
 * - Use `@evolyn/shared` for domain types and constants.
 * - Build UI using Tailwind CSS and components from `@/components/ui`.
 * ============================================================================
 */

export interface DashboardMetric {
  label: string;
  value: string | number;
  change?: string;
  status: 'positive' | 'negative' | 'neutral';
}

export interface WorkflowStep {
  step: string;
  title: string;
  description: string;
  status: 'upcoming' | 'active' | 'completed';
}

export {
  DashboardSidebar,
  DashboardHeader,
  WorkflowStepper,
  ComplianceOverview,
  ContentStatusChart,
  DashboardMetrics,
  RecentSubmissions,
  NewSubmissionModal,
} from '../../components/dashboard';
export type { SubmissionItem } from '../../components/dashboard';
