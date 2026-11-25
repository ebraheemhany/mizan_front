// app/api/auth/desktop/route.ts
import { backend, errorResponse, setRefreshCookie } from '@/lib/auth/server';

// POST { code } -> { accessToken, user }
// Desktop app: the one-time code the browser handed over after signing in there
// (see lib/desktop-sign-in.ts) becomes a session, with the refresh token in the cookie.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const code = typeof body?.code === 'string' ? body.code : '';
  const { status, data, retryAfter } = await backend('/api/auth/desktop-code/redeem', { code });

  if (status !== 200) return errorResponse(status, data, retryAfter);

  await setRefreshCookie(data.refreshToken, data.refreshTokenExpiresAt);
  return Response.json({ accessToken: data.accessToken, user: data.user });
}
