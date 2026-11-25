// lib/desktop.ts
// Mizan's desktop app (desktop/ in this repo, built with Tauri) shows this same site in
// a window of its own. It tells the page so through window.__MIZAN_DESKTOP__, and the
// page asks it, through Tauri's IPC, for what a window without a browser around it can't
// do alone: open links in the real browser, save and open files, print.
// The app only answers this site's own address (desktop/src-tauri/capabilities).
import { useSyncExternalStore } from 'react';

type DesktopInfo = {
  /** The desktop app's version (not the site's). */
  version: string;
  platform: 'windows' | 'macos' | 'linux';
};

type TauriInvoke = <T>(
  command: string,
  args?: Record<string, unknown> | Uint8Array,
  options?: { headers?: Record<string, string> },
) => Promise<T>;

declare global {
  interface Window {
    __MIZAN_DESKTOP__?: DesktopInfo;
    __TAURI__?: { core: { invoke: TauriInvoke } };
  }
}

/** The desktop app this page runs in, or null in a browser (and on the server). */
export function desktopApp(): DesktopInfo | null {
  if (typeof window === 'undefined' || !window.__TAURI__) return null;
  return window.__MIZAN_DESKTOP__ ?? null;
}

const subscribe = () => () => {};

/**
 * For components: false on the server and while hydrating (so the HTML matches), then
 * whether this page runs in the desktop app.
 */
export function useIsDesktop() {
  return useSyncExternalStore(subscribe, () => desktopApp() !== null, () => false);
}

/** Like useIsDesktop, with the app's details (its version, its system) instead of true. */
export function useDesktopApp() {
  return useSyncExternalStore(subscribe, desktopApp, () => null);
}

/** Calls one of the desktop app's commands (desktop/src-tauri/src/commands.rs). */
export function invokeDesktop<T>(
  command: string,
  args?: Record<string, unknown> | Uint8Array,
  headers?: Record<string, string>,
): Promise<T> {
  const tauri = window.__TAURI__;
  if (!tauri) return Promise.reject(new Error('Not running in the desktop app'));
  return tauri.core.invoke<T>(command, args, headers ? { headers } : undefined);
}

/**
 * Opens a link outside Mizan: a new tab in a browser, the computer's own browser (or
 * app, for WhatsApp) in the desktop app. In a browser, call it straight from the click,
 * or popup blockers stop it.
 */
export function openExternal(url: string) {
  if (desktopApp()) {
    void invokeDesktop('open_external', { url }).catch(() => window.location.assign(url));
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Prints the page (the desktop app prints through the system, which also works on macOS). */
export function printPage() {
  if (desktopApp()) {
    void invokeDesktop('print_page').catch(() => window.print());
    return;
  }
  window.print();
}
