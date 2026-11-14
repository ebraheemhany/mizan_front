// lib/auth/server.ts
// Server-only helpers for the auth route handlers in app/api/auth.
// The refresh token lives in an httpOnly cookie that JavaScript in the page
// can never read; only these route handlers touch it.
import 'server-only';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

export const REFRESH_COOKIE = 'mizan_rt';

/** Calls the backend and returns its status and parsed JSON body (if any). */
export async function backend(path: string, body?: unknown, accessToken?: string) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, data, retryAfter: res.headers.get('retry-after') };
}

export async function setRefreshCookie(token: string, expiresAt: string) {
  (await cookies()).set(REFRESH_COOKIE, token, {
    httpOnly: true,
    // Only over HTTPS in production; localhost is plain HTTP.
    secure: process.env.NODE_ENV === 'production',
    // Not sent on cross-site POSTs (CSRF), but still sent when someone opens
    // a link to the app from another site (e.g. an invite link in WhatsApp).
    sameSite: 'lax',
    path: '/',
    // Same lifetime as the refresh token itself (1 day, or 30 with "remember me").
    expires: new Date(expiresAt),
  });
}

export async function getRefreshCookie() {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}

export async function clearRefreshCookie() {
  (await cookies()).delete(REFRESH_COOKIE);
}

/** Passes a backend error through to the browser unchanged, keeping Retry-After. */
export function errorResponse(status: number, data: unknown, retryAfter?: string | null) {
  return Response.json(data ?? { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, {
    status,
    headers: retryAfter ? { 'Retry-After': retryAfter } : undefined,
  });
}
