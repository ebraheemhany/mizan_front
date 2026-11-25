// lib/auth/constants.ts
// Shared by proxy.ts (edge of every request) and the auth route handlers.

/** httpOnly cookie holding the refresh token. */
export const REFRESH_COOKIE = 'mizan_rt';

/**
 * First path segment (after the locale) of pages anyone can open without logging in.
 * Every other page requires a session, so a new dashboard page is protected by default.
 */
export const PUBLIC_SECTIONS = new Set([
  '', // marketing home
  'login',
  'register',
  'forgot-password',
  'reset-password', // the link in the "forgot password" email
  'verify-email', // the link in the "confirm your email" email
  'terms',
  'privacy',
  'invite', // accept an invitation
  'i', // public invoice link
  'share', // public quote link
  'desktop', // desktop app sign-in: the browser page, and the app's return from it
  'download', // the desktop app's download page
]);

/** Pages that make no sense when already logged in. */
export const GUEST_ONLY_SECTIONS = new Set(['login', 'register']);

/**
 * Where to go after logging in, taken from ?next=. Only paths inside this app
 * are allowed ("/invoices/12"), never another site ("//evil.com", "https://...").
 */
export function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  return value;
}
