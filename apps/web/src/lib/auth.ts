/**
 * Client-side auth token management and API auth helpers.
 *
 * Security strategy:
 * - Access token (RS256 JWT, 15-min) stored in a module-level variable (NOT localStorage)
 * - Refresh token (opaque, 7-day) stored in HttpOnly cookie by the API
 * - On 401 responses, fetchWithAuth transparently attempts a token refresh
 */

import { getApiOrigin } from './api-origin';

const API_BASE = getApiOrigin();
const API_PREFIX = `${API_BASE}/api/v1`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  hasActiveSubscription?: boolean;
  isSubscribed?: boolean;
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

interface RefreshResponse {
  accessToken: string;
}

// ---------------------------------------------------------------------------
// In-memory token store (never touches localStorage)
// ---------------------------------------------------------------------------

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// ---------------------------------------------------------------------------
// Auth actions
// ---------------------------------------------------------------------------

/**
 * Log in with email and password.
 * Stores the access token in memory and returns the user profile.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_PREFIX}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Login failed');
  }

  const json = await res.json();
  const data: LoginResponse = json.data;
  accessToken = data.accessToken;
  return data.user;
}

/**
 * Register a new account. Does not auto-login - user must verify email first.
 */
export async function register(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<{ id: string; email: string; firstName: string; lastName: string }> {
  const regRes = await fetch(`${API_PREFIX}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!regRes.ok) {
    const body = await regRes.json().catch(() => ({}));
    throw new Error(body.message || 'Registration failed');
  }

  const json = await regRes.json();
  return json.data;
}

/**
 * Log out -- revoke the refresh token server-side and clear the in-memory access token.
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_PREFIX}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });
  } catch {
    // Best-effort; we clear the token regardless
  } finally {
    accessToken = null;
  }
}

/**
 * Attempt to refresh the access token using the HttpOnly refresh cookie.
 * Returns true if successful.
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_PREFIX}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      accessToken = null;
      return false;
    }

    const json: { data: RefreshResponse } = await res.json();
    const data = json.data;
    if (data.accessToken) {
      accessToken = data.accessToken;
      return true;
    }
    return false;
  } catch {
    accessToken = null;
    return false;
  }
}

// ---------------------------------------------------------------------------
// Authenticated fetch wrapper
// ---------------------------------------------------------------------------

/**
 * Wrapper around fetch that:
 * 1. Injects the Bearer token from memory
 * 2. On a 401, attempts a single token refresh and retries once
 * 3. Always includes credentials (cookies)
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const makeHeaders = (): HeadersInit => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return headers;
  };

  // First attempt
  let res = await fetch(url, {
    ...options,
    headers: makeHeaders(),
    credentials: 'include',
  });

  // If 401, try refreshing and retry once
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await fetch(url, {
        ...options,
        headers: makeHeaders(),
        credentials: 'include',
      });
    }
  }

  return res;
}
