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
