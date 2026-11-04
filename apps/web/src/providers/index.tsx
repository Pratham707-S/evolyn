import React from 'react';

export interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Global App Providers
 * Wraps root components with context providers (Auth, Notifications, Theme)
 */
export function AppProviders({ children }: AppProvidersProps) {
  return <>{children}</>;
}
