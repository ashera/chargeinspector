// hooks/useAuth.js
// ------------------------------------------------------------
// AuthProvider  — manages in-memory access token + silent refresh
// useAuth()     — consumer hook
// apiFetch()    — authenticated fetch with auto-refresh
// ------------------------------------------------------------

import { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';

const AuthContext = createContext(null);

// How many seconds before expiry we proactively refresh
const REFRESH_LEAD_SECONDS = 60;

// ── Decode JWT payload (no verification — server already verified) ──
function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// ── AuthProvider ─────────────────────────────────────────────

export function AuthProvider({ children }) {
  // All token state lives in refs — never in React state — so renders aren't
  // triggered on every silent refresh.
  const accessTokenRef  = useRef(null);
  const userIdRef       = useRef(null);
  const refreshTimerRef = useRef(null);

  // Only two pieces of React state: authenticated flag + loading
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser]                       = useState(null);
  const [loading, setLoading]                 = useState(true);

  // ── Internals ──────────────────────────────────────────────

  const clearTokenState = useCallback(() => {
    accessTokenRef.current = null;
    userIdRef.current      = null;
    clearTimeout(refreshTimerRef.current);
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  /**
   * Store access token and schedule the next silent refresh.
   */
  const storeAccessToken = useCallback((token, userData) => {
    accessTokenRef.current = token;
    userIdRef.current      = userData.id;
    setUser(userData);
    setIsAuthenticated(true);

    const payload = decodeJwt(token);
    if (!payload?.exp) return;

    const msUntilRefresh = (payload.exp - REFRESH_LEAD_SECONDS) * 1000 - Date.now();
    clearTimeout(refreshTimerRef.current);

    if (msUntilRefresh > 0) {
      refreshTimerRef.current = setTimeout(() => silentRefresh(), msUntilRefresh);
    } else {
      // Already within the lead window — refresh immediately
      silentRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * POST /auth/refresh using the httpOnly cookie.
   * Returns new access token string on success, null on failure.
   */
  const silentRefresh = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return null;

    try {
      const res = await fetch('/auth/refresh', {
        method: 'POST',
        credentials: 'include',            // sends the httpOnly cookie
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        clearTokenState();
        return null;
      }

      const data = await res.json();
      storeAccessToken(data.accessToken, data.user);
      return data.accessToken;
    } catch {
      clearTokenState();
      return null;
    }
  }, [clearTokenState, storeAccessToken]);

  // ── Bootstrap: attempt silent refresh on mount ────────────
  useEffect(() => {
    // We don't know the userId yet (it's only in the refresh token cookie),
    // so we need to either: (a) persist userId in localStorage/sessionStorage,
    // or (b) use a separate non-sensitive cookie. Option (b) used here.
    const storedUserId = sessionStorage.getItem('auth_uid');
    if (storedUserId) {
      userIdRef.current = storedUserId;
      silentRefresh().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return () => clearTimeout(refreshTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Public API ─────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    const res = await fetch('/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    sessionStorage.setItem('auth_uid', data.user.id);
    storeAccessToken(data.accessToken, data.user);
    return data.user;
  }, [storeAccessToken]);

  const register = useCallback(async (email, password) => {
    const res = await fetch('/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    sessionStorage.setItem('auth_uid', data.user.id);
    storeAccessToken(data.accessToken, data.user);
    return data.user;
  }, [storeAccessToken]);

  const logout = useCallback(async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessTokenRef.current
            ? { Authorization: `Bearer ${accessTokenRef.current}` }
            : {}),
        },
      });
    } catch {
      // Best-effort
    } finally {
      sessionStorage.removeItem('auth_uid');
      clearTokenState();
    }
  }, [clearTokenState]);

  const logoutAll = useCallback(async () => {
    try {
      await fetch('/auth/logout-all', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessTokenRef.current
            ? { Authorization: `Bearer ${accessTokenRef.current}` }
            : {}),
        },
      });
    } catch {
      // Best-effort
    } finally {
      sessionStorage.removeItem('auth_uid');
      clearTokenState();
    }
  }, [clearTokenState]);

  /**
   * apiFetch — drop-in replacement for fetch() for authenticated endpoints.
   *
   * - Attaches Authorization: Bearer header automatically
   * - On 401, attempts one silent refresh then retries
   * - On second 401, clears session and rejects
   *
   * Usage:
   *   const res = await apiFetch('/api/posts', { method: 'POST', body: ... });
   */
  const apiFetch = useCallback(async (url, options = {}) => {
    const makeRequest = async (token) => {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      return fetch(url, { ...options, credentials: 'include', headers });
    };

    let res = await makeRequest(accessTokenRef.current);

    if (res.status === 401) {
      // Try to refresh once
      const newToken = await silentRefresh();
      if (!newToken) {
        // Refresh failed — session is gone
        throw new Error('Session expired. Please log in again.');
      }
      // Retry with fresh token
      res = await makeRequest(newToken);

      if (res.status === 401) {
        clearTokenState();
        throw new Error('Session expired. Please log in again.');
      }
    }

    return res;
  }, [silentRefresh, clearTokenState]);

  const value = {
    isAuthenticated,
    loading,
    user,
    login,
    register,
    logout,
    logoutAll,
    apiFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── useAuth hook ──────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
