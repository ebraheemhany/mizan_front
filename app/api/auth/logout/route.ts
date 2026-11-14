// app/api/auth/logout/route.ts
import { backend, clearRefreshCookie, getRefreshCookie } from '@/lib/auth/server';

// POST -> 204. Ends the session on the backend and removes the cookie.
export async function POST() {
  const refreshToken = await getRefreshCookie();
  if (refreshToken) {
    // Logging out locally must not fail just because the backend is unreachable.
    await backend('/api/auth/logout', { refreshToken }).catch(() => undefined);
  }
  await clearRefreshCookie();
  return new Response(null, { status: 204 });
}
