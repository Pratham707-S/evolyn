import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api/client';

export function useApi<T>(endpoint: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(endpoint));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!endpoint) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    apiClient<T>(endpoint)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [endpoint]);

  return { data, isLoading, error };
}
