// component/GoogleButton.tsx
// Google's own "Continue with Google" button (Google Identity Services). Clicking it
// opens Google's sign-in window; when the person picks an account, Google hands us
// an ID token (the "credential"), which the backend checks before trusting anything.
'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';

/** The Web application OAuth client (not secret). Without it the button isn't shown. */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

type GoogleIdentity = {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
        ux_mode: 'popup';
        context: 'signin' | 'signup' | 'use';
        auto_select: boolean;
        cancel_on_tap_outside: boolean;
      }): void;
      renderButton(
        parent: HTMLElement,
        options: {
          type: 'standard';
          theme: 'outline' | 'filled_blue';
          size: 'large';
          text: 'continue_with' | 'signin_with' | 'signup_with';
          shape: 'rectangular' | 'pill';
          logo_alignment: 'left' | 'center';
          width: number;
          locale: string;
        },
      ): void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let loading: Promise<GoogleIdentity> | null = null;

/** Loads Google's script once per page, however many buttons ask for it. */
function loadGoogle() {
  loading ??= new Promise<GoogleIdentity>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => (window.google ? resolve(window.google) : reject(new Error('Google script loaded empty')));
    script.onerror = () => {
      // Blocked or offline: let a later mount try again.
      loading = null;
      reject(new Error('Google script failed to load'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export default function GoogleButton({
  onCredential,
  context = 'signin',
}: {
  onCredential: (credential: string) => void;
  context?: 'signin' | 'signup' | 'use';
}) {
  const locale = useLocale();
  const container = useRef<HTMLDivElement>(null);
  // The newest callback, without drawing the button again each render.
  const callback = useRef(onCredential);
  useEffect(() => {
    callback.current = onCredential;
  });

  useEffect(() => {
    let cancelled = false;
    loadGoogle()
      .then((google) => {
        const parent = container.current;
        if (cancelled || !parent) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) callback.current(response.credential);
          },
          ux_mode: 'popup',
          context,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        parent.replaceChildren();
        google.accounts.id.renderButton(parent, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          // Google draws it at a fixed width (200-400px): as wide as the form allows.
          width: Math.max(200, Math.min(400, Math.floor(parent.getBoundingClientRect().width))),
          locale,
        });
      })
      .catch(() => {
        // No button (Google unreachable or blocked): the email form below still works.
      });
    return () => {
      cancelled = true;
    };
  }, [context, locale]);

  // Google's button is 44px tall; the space is kept while it loads.
  return <div ref={container} className="flex min-h-11 w-full justify-center" />;
}
