// component/dashbord/reports/ReportState.tsx
'use client';

import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { cn } from '@/lib/utils';

export const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 border text-xs font-bold';

/** A card-sized spinner, or the error with a retry button: never zeros in place of a report. */
export function ReportState({
  error,
  onRetry,
  className,
}: {
  /** Set once loading failed; otherwise a spinner is shown. */
  error?: unknown;
  onRetry: () => void;
  className?: string;
}) {
  const t = useTranslations('ReportsApi');
  const errorMessage = useApiErrorMessage();

  return (
    <div
      className={cn(
        'rounded-card border-line bg-surface flex min-h-40 flex-col items-center justify-center gap-3 border p-5 text-center shadow-sm',
        className,
      )}
    >
      {error ? (
        <>
          <p className="text-danger text-sm font-semibold">{errorMessage(error)}</p>
          <Button variant="outline" className={cn(outlineBtn, 'print:hidden')} onClick={onRetry}>
            {t('retry')}
          </Button>
        </>
      ) : (
        <Loader2 className="text-muted size-5 animate-spin" />
      )}
    </div>
  );
}

/** Renders `children` with the query's data once it is there; until then a spinner or the error. */
export function WithReport<T>({
  query,
  className,
  children,
}: {
  query: UseQueryResult<T>;
  /** For the spinner/error card (e.g. its grid span). */
  className?: string;
  children: (data: T) => ReactNode;
}) {
  if (query.data !== undefined) return children(query.data);
  return (
    <ReportState
      error={query.isError ? query.error : undefined}
      onRetry={() => void query.refetch()}
      className={className}
    />
  );
}
