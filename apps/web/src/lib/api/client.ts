import { env } from 'process';

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }

  // If running in browser
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return `${window.location.protocol}//${window.location.hostname}:5001`;
    }

    // In production browser without explicit NEXT_PUBLIC_API_URL, default to current origin (uses Next.js rewrites)
    return window.location.origin;
  }

  // Server-side rendering fallback
  return process.env.API_URL
    ? process.env.API_URL.replace(/\/$/, '')
    : 'http://localhost:5001';
}

const API_BASE_URL = getApiBaseUrl();

export interface ApiClientOptions extends RequestInit {
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { timeoutMs = 15000, params, ...requestOptions } = options;

  let urlPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      urlPath += `${urlPath.includes('?') ? '&' : '?'}${queryString}`;
    }
  }

  const url = `${API_BASE_URL}${urlPath}`;

  const headers = new Headers(requestOptions.headers);
  if (!headers.has('Content-Type') && !(requestOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Set correlation ID for request tracing
  if (!headers.has('x-request-id') && typeof crypto !== 'undefined' && crypto.randomUUID) {
    headers.set('x-request-id', crypto.randomUUID());
  }

  // Abort controller for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...requestOptions,
      headers,
      signal: requestOptions.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: unknown;
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        errorData = await response.json();
        if (
          errorData &&
          typeof errorData === 'object' &&
          'error' in errorData &&
          typeof (errorData as { error: unknown }).error === 'string'
        ) {
          errorMessage = (errorData as { error: string }).error;
        } else if (
          errorData &&
          typeof errorData === 'object' &&
          'message' in errorData &&
          typeof (errorData as { message: unknown }).message === 'string'
        ) {
          errorMessage = (errorData as { message: string }).message;
        }
      } catch {
        errorData = null;
      }

      throw new ApiClientError(errorMessage, response.status, errorData);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiClientError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiClientError(
        `API request timed out after ${timeoutMs}ms: ${endpoint}. The backend server may still be processing.`,
        408
      );
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : 'Unknown network error',
      0,
      error
    );
  }
}

// Convenience methods
apiClient.get = <T>(endpoint: string, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'GET' });

apiClient.post = <T>(endpoint: string, body?: unknown, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

apiClient.put = <T>(endpoint: string, body?: unknown, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

apiClient.patch = <T>(endpoint: string, body?: unknown, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

apiClient.delete = <T>(endpoint: string, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'DELETE' });
