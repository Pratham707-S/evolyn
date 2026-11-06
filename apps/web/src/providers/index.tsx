'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Global App Providers
 * Wraps root components with TanStack Query and application context providers
 */
export function AppProviders({ children }: AppProvidersProps) {
  // Ensure QueryClient is instantiated once per client session to prevent SSR state leaks
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds fresh cache
            gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
