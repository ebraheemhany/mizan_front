// lib/files.ts
// Files the app makes (CSV exports, invoices) or fetches (receipts, payment proofs):
// saved or shown in a browser tab, or through the computer itself in the desktop app.
import { desktopApp, invokeDesktop } from '@/lib/desktop';

/** Bytes for the desktop app, with the file's name in a header (headers must be ASCII). */
async function forDesktop(blob: Blob, fileName: string) {
  return [new Uint8Array(await blob.arrayBuffer()), { 'x-file-name': encodeURIComponent(fileName) }] as const;
}

/**
 * Saves a file: a download in a browser, a "Save as" window in the desktop app.
 * Resolves false when the person cancels that window.
 */
export async function saveFile(blob: Blob, fileName: string): Promise<boolean> {
  if (desktopApp()) {
    const [bytes, headers] = await forDesktop(blob, fileName);
    return invokeDesktop<boolean>('save_file', bytes, headers);
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

const EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
};

/**
 * Shows a protected file (a receipt, a proof of payment) once it has loaded.
 * In a browser a new tab opens at once (inside the click, so popup blockers allow it)
 * and gets the file when it arrives; the desktop app opens it in the computer's own
 * viewer, since its window has no tabs.
 */
export async function showFile(load: () => Promise<Blob>, baseName: string) {
  if (desktopApp()) {
    const blob = await load();
    const extension = EXTENSIONS[blob.type.split(';')[0].trim()] ?? 'bin';
    const [bytes, headers] = await forDesktop(blob, `${baseName}.${extension}`);
    await invokeDesktop('open_file', bytes, headers);
    return;
  }

  const tab = window.open('', '_blank');
  try {
    const url = URL.createObjectURL(await load());
    if (tab) tab.location.href = url;
    else window.location.href = url;
    // Long enough for the tab to load it.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    tab?.close();
    throw error;
  }
}
