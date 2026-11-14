// proxy.ts (Next.js 16: the new name for middleware.ts)
// Runs before every page request:
// 1. Auth redirects, from the presence of the session cookie only. This is a
//    fast "optimistic" check; the session itself is verified by the refresh in
//    SessionProvider, and every API call is checked by the backend.
// 2. Locale handling (next-intl): adds /ar or /en and sets the locale.
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { GUEST_ONLY_SECTIONS, PUBLIC_SECTIONS, REFRESH_COOKIE } from './lib/auth/constants';

const handleLocale = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const [locale, section = '', ...rest] = pathname.split('/').filter(Boolean);

  // No locale in the URL yet: next-intl redirects to /ar/... or /en/..., and
  // this proxy runs again on that URL.
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    return handleLocale(request);
  }

  const hasSession = request.cookies.has(REFRESH_COOKIE);

  if (!hasSession && !PUBLIC_SECTIONS.has(section)) {
    const login = new URL(`/${locale}/login`, request.url);
    // Come back here after logging in (path without the locale).
    login.searchParams.set('next', `/${[section, ...rest].join('/')}${search}`);
    return NextResponse.redirect(login);
  }

  if (hasSession && GUEST_ONLY_SECTIONS.has(section)) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return handleLocale(request);
}

export const config = {
  // Every page, but not API routes, Next.js internals or files with an extension.
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
