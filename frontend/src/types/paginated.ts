/** Wrapper for paginated API responses. */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
