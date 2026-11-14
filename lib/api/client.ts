// lib/api/client.ts
// The one place the browser talks to the backend.
// - Adds the access token (kept in memory only, never in localStorage).
// - On a 401, refreshes the session once and retries the request.
// - Turns backend errors into ApiError with the backend's error code.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type Role = 'owner' | 'accountant' | 'sales' | 'viewer';

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
  company: { id: string; name: string };
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: {
      fieldErrors?: Record<string, string[]>;
      retryAfterSeconds?: number;
    },
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function toApiError(res: Response) {
  const body = await res.json().catch(() => null);
  const error = body?.error;
  return new ApiError(
    res.status,
    error?.code ?? 'INTERNAL_ERROR',
    error?.message ?? res.statusText,
    error?.details,
  );
}

async function send(input: string, init: RequestInit) {
  try {
    return await fetch(input, init);
  } catch {
    // Server down, no internet, CORS failure...
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server');
  }
}

// ---------------------------------------------------------------------------
// Session (access token in memory)
// ---------------------------------------------------------------------------

let accessToken: string | null = null;
let refreshing: Promise<{ accessToken: string; user: SessionUser } | null> | null = null;

/**
 * Gets a new access token using the httpOnly refresh cookie.
 * Returns null when there is no valid session (401). Throws ApiError for
 * anything else (server unreachable...): that is not the same as logged out.
 *
 * Only one refresh runs at a time: within this tab (shared promise) and across
 * tabs (Web Locks). Refresh tokens rotate, so two refreshes racing with the same
 * cookie would look like token theft and end the session.
 */
export function refreshSession() {
  refreshing ??= (async () => {
    const run = async () => {
      const res = await send('/api/auth/refresh', { method: 'POST' });
      if (res.status === 401) {
        accessToken = null;
        return null;
      }
      if (!res.ok) throw await toApiError(res);
      const data = (await res.json()) as { accessToken: string; user: SessionUser };
      accessToken = data.accessToken;
      return data;
    };
    return typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request('mizan-auth-refresh', run)
      : run();
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function login(values: { email: string; password: string; remember: boolean }) {
  const res = await send('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  if (!res.ok) throw await toApiError(res);
  const data = (await res.json()) as { accessToken: string; user: SessionUser };
  accessToken = data.accessToken;
  return data.user;
}

export async function logout() {
  accessToken = null;
  await send('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
}

// Lets the app react when a request finds the session gone (see QueryProvider).
const sessionExpiredListeners = new Set<() => void>();

export function onSessionExpired(listener: () => void) {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

// ---------------------------------------------------------------------------
// Calling the backend
// ---------------------------------------------------------------------------

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** false for public endpoints (register, invitation preview/accept). */
  auth?: boolean;
};

export async function api<T>(path: string, { method = 'GET', body, auth = true }: ApiOptions = {}): Promise<T> {
  const call = () =>
    send(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  let res = await call();

  // Access token missing or expired (15 min): refresh once and try again.
  if (res.status === 401 && auth) {
    if (await refreshSession()) {
      res = await call();
    } else {
      // The refresh token is gone too (expired, logged out in another tab...).
      sessionExpiredListeners.forEach((listener) => listener());
    }
  }

  if (!res.ok) throw await toApiError(res);
  return (res.status === 204 ? undefined : await res.json()) as T;
}
