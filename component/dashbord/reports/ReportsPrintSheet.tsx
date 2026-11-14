'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

const subscribe = () => () => {};

export default function ReportsPrintSheet({
  title,
  period,
  basis,
  tab,
  children,
}: {
  title: string;
  period: string;
  basis: string;
  tab: string;
  children: React.ReactNode;
}) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!mounted) return null;

  return createPortal(
    <div id="print-root" className="text-ink hidden">
      <header className="border-line-strong flex items-end justify-between gap-6 border-b-2 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="text-muted mt-1 text-xs">{basis}</p>
        </div>
        <div className="text-end">
          <p className="text-ink text-sm font-bold">{period}</p>
          <p className="text-muted mt-1 text-xs">{tab}</p>
        </div>
      </header>

      <main className="mt-5 space-y-4">{children}</main>
    </div>,
    document.body,
  );
}
