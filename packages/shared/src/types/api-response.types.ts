// Standard API response envelope
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
}

// Pagination query params
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
