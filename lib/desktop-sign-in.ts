// lib/desktop-sign-in.ts
// "Continue with Google" in the desktop app. Google refuses to sign in inside an
// embedded browser, so it goes through the computer's own browser:
// 1. The app (this site, in its window) opens /desktop/sign-in in the browser with a
//    random `state`, which it keeps here.
// 2. The person signs in there with Google. That page asks the backend for a one-time
//    code and opens mizan://auth?code=...&state=...
// 3. The app receives the link and loads /desktop/callback?code=...&state=... in its
//    window. That page checks the state is the one kept in step 1 (so a link someone
//    else made can't sign the app into their account), then trades the code for a session.
import { useSyncExternalStore } from 'react';
import { safeNextPath } from '@/lib/auth/constants';
import { openExternal } from '@/lib/desktop';

const STORAGE_KEY = 'mizan-desktop-sign-in';
/** Time to finish signing in in the browser. */
const PENDING_TTL_MS = 15 * 60 * 1000;

type Pending = {
  state: string;
  /** Where to go once signed in (the login page's ?next=). */
  next: string | null;
  startedAt: number;
};

function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Looks like a state randomState() made. */
export const isDesktopState = (value: string) => /^[a-f0-9]{48}$/.test(value);

const noSubscription = () => () => {};

/**
 * The page's query string, read in the browser: null on the server and while hydrating.
 * (useSearchParams would stop these pages from prerendering.)
 */
export function useSearch() {
  return useSyncExternalStore(noSubscription, () => window.location.search, () => null);
}

/** Step 1, in the app: opens the browser page that signs in with Google. */
export function startDesktopGoogleSignIn({ locale, invitationToken }: { locale: string; invitationToken?: string }) {
  const pending: Pending = {
    state: randomState(),
    next: safeNextPath(new URLSearchParams(window.location.search).get('next')),
    startedAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // Storage blocked: the return will fail its check and say so.
  }

  const url = new URL(`/${locale}/desktop/sign-in`, window.location.origin);
  url.searchParams.set('state', pending.state);
  if (invitationToken) url.searchParams.set('invitation', invitationToken);
  openExternal(url.toString());
}

/** Step 3, in the app: the sign-in started with this state, if it's still waiting. */
export function findPendingSignIn(state: string): Pending | null {
  try {
    const pending = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Pending | null;
    if (!pending || pending.state !== state || Date.now() - pending.startedAt > PENDING_TTL_MS) return null;
    return pending;
  } catch {
    return null;
  }
}

export function clearPendingSignIn() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** Step 2, in the browser: the link that hands the code to the app. */
export const desktopAppLink = (code: string, state: string) =>
  `mizan://auth?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
