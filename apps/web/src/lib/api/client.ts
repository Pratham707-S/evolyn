import { env } from 'process';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5001`
    : 'http://localhost:5001');

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
        `API request timed out after ${timeoutMs}ms: ${endpoint}`,
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
