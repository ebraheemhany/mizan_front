// app/api/auth/refresh/route.ts
import { backend, clearRefreshCookie, errorResponse, getRefreshCookie, setRefreshCookie } from '@/lib/auth/server';

// POST -> { accessToken, user }
// Uses the refresh token from the cookie, stores the rotated one, and also
// returns the current user so a page load needs only this one call.
export async function POST() {
  const refreshToken = await getRefreshCookie();
  if (!refreshToken) {
    return errorResponse(401, { error: { code: 'NO_SESSION', message: 'Not logged in' } });
  }

  const refreshed = await backend('/api/auth/refresh', { refreshToken });
  if (refreshed.status !== 200) {
    // Expired, revoked or reused: the cookie is useless now. Any other failure
    // (backend down...) keeps it, so the user is still logged in once it's back.
    if (refreshed.status === 401) await clearRefreshCookie();
    return errorResponse(refreshed.status, refreshed.data, refreshed.retryAfter);
  }

  await setRefreshCookie(refreshed.data.refreshToken, refreshed.data.refreshTokenExpiresAt);

  const me = await backend('/api/auth/me', undefined, refreshed.data.accessToken);
  if (me.status !== 200) return errorResponse(me.status, me.data);

  return Response.json({ accessToken: refreshed.data.accessToken, user: me.data.user });
}
