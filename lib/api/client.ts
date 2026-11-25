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
  /** null until the user opens the confirmation link emailed to them. */
  emailVerifiedAt: string | null;
  company: { id: string; name: string };
  /** false: made with Google and never set a password (nothing to confirm when setting one). */
  hasPassword?: boolean;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: {
      fieldErrors?: Record<string, string[]>;
      retryAfterSeconds?: number;
      /** GOOGLE_NO_ACCOUNT: who Google says this is; GOOGLE_EMAIL_MISMATCH: the invited address. */
      email?: string;
      fullName?: string;
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

export type GoogleSignIn = {
  /** The ID token Google Identity Services handed the page. */
  credential: string;
  remember: boolean;
  /** For someone without an account: the company to create (they become its owner). */
  companyName?: string;
  /** Accepts this invitation with the Google account instead of a password. */
  invitationToken?: string;
};

/** "Continue with Google": through the Next.js route, so the refresh token lands in the cookie. */
export async function continueWithGoogle(values: GoogleSignIn) {
  const res = await send('/api/auth/google', {
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

/**
 * Changes the password. Goes through the Next.js route (not straight to the
 * backend) because the new refresh token must land in the httpOnly cookie.
 * Every other device is logged out; this one keeps going with new tokens.
 */
export async function changePassword(values: { currentPassword?: string; newPassword: string }) {
  const call = () =>
    send('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(values),
    });

  let res = await call();
  // Access token expired: refresh once and try again (same as api()).
  if (res.status === 401 && (await refreshSession())) res = await call();
  if (!res.ok) throw await toApiError(res);
  accessToken = ((await res.json()) as { accessToken: string }).accessToken;
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

/** Sends a signed-in request, refreshing the session once if the access token ran out. */
async function withSession(init: (token: string | null) => RequestInit, path: string) {
  const call = () => send(`${API_URL}${path}`, init(accessToken));
  let res = await call();
  if (res.status === 401) {
    if (await refreshSession()) res = await call();
    else sessionExpiredListeners.forEach((listener) => listener());
  }
  if (!res.ok) throw await toApiError(res);
  return res;
}

/**
 * Uploads a file as the request body (PUT): the server checks its real type and
 * size. Its name travels in X-File-Name (URI-encoded, so Arabic names survive).
 */
export async function apiUpload<T>(path: string, file: Blob, name?: string): Promise<T> {
  const res = await withSession(
    (token) => ({
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        ...(name ? { 'X-File-Name': encodeURIComponent(name) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: file,
    }),
    path,
  );
  return (await res.json()) as T;
}

/**
 * Sends a file from a public page (no login): a customer's receipt on the invoice link.
 * POST with the file as the body; anything else the server needs goes in `path`'s query.
 */
export async function apiPublicUpload<T>(path: string, file: Blob, name?: string): Promise<T> {
  const res = await send(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      ...(name ? { 'X-File-Name': encodeURIComponent(name) } : {}),
    },
    body: file,
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

/** A protected file (a receipt), to show or save. */
export async function apiBlob(path: string): Promise<Blob> {
  const res = await withSession(
    (token): RequestInit => ({ headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
    path,
  );
  return res.blob();
}

/** Where a company logo is shown from (no login needed; it is on public invoices too). */
export const publicLogoUrl = (id: string) => `${API_URL}/api/public/logos/${id}`;
