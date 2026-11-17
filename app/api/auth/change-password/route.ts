// app/api/auth/change-password/route.ts
import { backend, errorResponse, setRefreshCookie } from '@/lib/auth/server';

// POST { currentPassword, newPassword } with the access token in Authorization.
// -> { accessToken }. The backend ends every session (all devices) and starts a
// new one for this device; its refresh token replaces the cookie here.
export async function POST(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : undefined;
  if (!accessToken) {
    return errorResponse(401, { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }

  const body = await request.json().catch(() => ({}));
  const { status, data, retryAfter } = await backend('/api/auth/change-password', body, accessToken);
  if (status !== 200) return errorResponse(status, data, retryAfter);

  await setRefreshCookie(data.refreshToken, data.refreshTokenExpiresAt);
  return Response.json({ accessToken: data.accessToken });
}
