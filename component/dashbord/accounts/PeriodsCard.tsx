// component/dashbord/accounts/PeriodsCard.tsx
// The closing state: the last closed month, the open ones, the fiscal year.
'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useReopenPeriod, type Periods } from '@/lib/ledger/hooks';
import { cn } from '@/lib/utils';
import { card, cardTitle, outlineBtn, useDay, useMonthLabel } from './ledger-ui';

type Status = 'closed' | 'open' | 'running';

const STATUS_STYLES: Record<Status, string> = {
  closed: 'bg-brand-soft text-brand-deep',
  open: 'bg-info-soft text-info',
  running: 'bg-neutral-soft text-ink-2',
};

/** The day a timestamp falls on in Egypt ("yyyy-mm-dd"). */
const cairoDay = (timestamp: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(timestamp),
  );

/** Open months shown before the rest are summed up in one line. */
const SHOWN_OPEN = 3;

export default function PeriodsCard({
  periods,
  canReopen,
  onRequestClose,
}: {
  periods: Periods;
  canReopen: boolean;
  onRequestClose: () => void;
}) {
  const t = useTranslations('Accounts.close');
  const errorMessage = useApiErrorMessage();
  const reopen = useReopenPeriod();
  const monthLabel = useMonthLabel();
  const day = useDay();

  const rows: { id: string; title: string; hint: string; status: Status; action?: React.ReactNode }[] = [];
  for (const m of periods.open.slice(0, SHOWN_OPEN)) {
    const drafts = m.drafts ? t('drafts', { count: m.drafts }) : t('noDrafts');
    rows.push({
      id: m.month,
      title: monthLabel(m.month),
      hint: m.ended ? t('hints.ended', { drafts }) : t('hints.current', { drafts }),
      status: m.ended ? 'open' : 'running',
    });
  }
  const moreOpen = periods.open.length - SHOWN_OPEN;
  if (periods.closedThrough) {
    rows.push({
      id: 'closed',
      title: monthLabel(periods.closedThrough.slice(0, 7)),
      hint: periods.closedAt
        ? t('hints.closed', { date: day(cairoDay(periods.closedAt)) })
        : t('hints.closedBefore'),
      status: 'closed',
      action: canReopen ? (
        <button
          type="button"
          disabled={reopen.isPending}
          onClick={async () => {
            try {
              await reopen.mutateAsync();
              toast.success(t('reopened', { month: monthLabel(periods.closedThrough!.slice(0, 7), false) }));
            } catch (error) {
              toast.error(errorMessage(error));
            }
          }}
          className="text-muted hover:text-ink text-[11px] font-bold underline-offset-2 hover:underline disabled:opacity-50"
        >
          {t('reopen')}
        </button>
      ) : null,
    });
  }

  return (
    <section className={card}>
      <h2 className={cardTitle}>{t('title')}</h2>
      <div className="divide-line divide-y px-5">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0 text-start">
              <p className="text-ink text-sm font-extrabold">{r.title}</p>
              <p className="text-muted mt-0.5 text-[11px]">{r.hint}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {r.action}
              <span
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
                  STATUS_STYLES[r.status],
                )}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {t(`status.${r.status}`)}
              </span>
            </div>
          </div>
        ))}
        {moreOpen > 0 && <p className="text-muted py-3 text-[11px]">{t('moreOpen', { count: moreOpen })}</p>}
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0 text-start">
            <p className="text-ink text-sm font-extrabold">
              {t('fiscalYear', { year: periods.fiscalYear.start.slice(0, 4) })}
            </p>
            <p className="text-muted mt-0.5 text-[11px]">
              {t('hints.year', { date: day(periods.fiscalYear.end, true) })}
            </p>
          </div>
          <span
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
              STATUS_STYLES.running,
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {t('status.running')}
          </span>
        </div>
      </div>

      {periods.toClose && (
        <div className="p-5 pt-4">
          <button type="button" onClick={onRequestClose} className={outlineBtn}>
            {t('closeButton', { month: monthLabel(periods.toClose, false) })}
          </button>
        </div>
      )}
    </section>
  );
}
