// app/api/auth/login/route.ts
import { backend, errorResponse, setRefreshCookie } from '@/lib/auth/server';

// POST { email, password, remember } -> { accessToken, user }
// The refresh token goes into the httpOnly cookie and is never sent to the page.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { status, data, retryAfter } = await backend('/api/auth/login', body);

  if (status !== 200) return errorResponse(status, data, retryAfter);

  await setRefreshCookie(data.refreshToken, data.refreshTokenExpiresAt);
  return Response.json({ accessToken: data.accessToken, user: data.user });
}
