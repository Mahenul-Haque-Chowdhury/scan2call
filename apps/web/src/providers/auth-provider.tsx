'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  type AuthUser,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  refreshAccessToken,
  setAccessToken,
  getAccessToken,
} from '@/lib/auth';
import { apiClient } from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Normalize API user to AuthUser (maps isSubscribed → hasActiveSubscription)
// ---------------------------------------------------------------------------

function normalizeUser(apiUser: AuthUser): AuthUser {
  return {
    ...apiUser,
    hasActiveSubscription: apiUser.hasActiveSubscription ?? apiUser.isSubscribed ?? false,
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --------------------------------------------------
  // On mount: try to restore session via refresh token
  // --------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const ok = await refreshAccessToken();
        if (!ok || cancelled) {
          setIsLoading(false);
          return;
        }

        // Fetch the user profile with the fresh token
        const res = await apiClient.get<{ data: AuthUser }>('/users/me');
        if (!cancelled) {
          setUser(normalizeUser(res.data));
        }
      } catch {
        // No valid session -- that's fine
        setAccessToken(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // --------------------------------------------------
  // Actions
  // --------------------------------------------------

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await authLogin(email, password);
    setUser(normalizeUser(loggedInUser));
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }) => {
      await authRegister(data);
      // Don't set user - they need to verify email first
    },
    [],
  );

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const res = await apiClient.get<{ data: AuthUser }>('/users/me');
      setUser(normalizeUser(res.data));
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  // --------------------------------------------------
  // Memoised context value
  // --------------------------------------------------

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
