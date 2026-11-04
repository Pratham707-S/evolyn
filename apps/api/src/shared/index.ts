/**
 * Internal API Shared Utilities & Types
 * Helpers scoped specifically to the Express backend
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
