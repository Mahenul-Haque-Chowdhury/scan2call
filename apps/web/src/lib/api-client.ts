/**
 * Typed API client for the Scan2Call backend.
 *
 * All requests go through fetchWithAuth from auth.ts so that:
 * - Bearer tokens are injected automatically
 * - 401s trigger a transparent refresh + retry
 * - HttpOnly cookies are always sent (credentials: 'include')
 */

import { fetchWithAuth } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = `${API_BASE}/api/v1`;

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown,
  ) {
    // Try to extract a human-readable message from the response body
    let msg: string | null = null;
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      // API error envelope: { error: { message } }
      if (d.error && typeof d.error === 'object' && 'message' in (d.error as object)) {
        msg = String((d.error as Record<string, unknown>).message);
      } else if ('message' in d) {
        msg = String(d.message);
      }
    }
    super(msg ?? `API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

// ---------------------------------------------------------------------------
// Response handler
// ---------------------------------------------------------------------------

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      // not JSON
    }
    throw new ApiError(res.status, res.statusText, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const apiClient = {
  get<T = unknown>(path: string): Promise<T> {
    return fetchWithAuth(`${API_PREFIX}${path}`, {
      method: 'GET',
    }).then((res) => handleResponse<T>(res));
  },

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return fetchWithAuth(`${API_PREFIX}${path}`, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((res) => handleResponse<T>(res));
  },

  patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return fetchWithAuth(`${API_PREFIX}${path}`, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((res) => handleResponse<T>(res));
  },

  delete<T = unknown>(path: string): Promise<T> {
    return fetchWithAuth(`${API_PREFIX}${path}`, {
      method: 'DELETE',
    }).then((res) => handleResponse<T>(res));
  },
};
