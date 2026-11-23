// app/api/auth/google/route.ts
import { backend, errorResponse, setRefreshCookie } from '@/lib/auth/server';

// POST { credential, remember, companyName?, invitationToken? } -> { accessToken, user }
// "Continue with Google": same as login, the refresh token goes into the httpOnly cookie.
// 404 GOOGLE_NO_ACCOUNT (with the name and email Google gave) asks for a company name first.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { status, data, retryAfter } = await backend('/api/auth/google', body);

  if (status !== 200 && status !== 201) return errorResponse(status, data, retryAfter);

  await setRefreshCookie(data.refreshToken, data.refreshTokenExpiresAt);
  return Response.json({ accessToken: data.accessToken, user: data.user });
}
