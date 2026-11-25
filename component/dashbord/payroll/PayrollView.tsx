// component/dashbord/payroll/PayrollView.tsx
// The months prepared so far, and preparing a new one.
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, CalendarPlus, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  dialogCancelButton,
  dialogClose,
  dialogConfirmButton,
  dialogDescription,
  dialogFooterBar,
  dialogHeaderBar,
  dialogHeading,
  dialogIconTile,
  dialogPopup,
  dialogTitle,
} from '@/component/dialog-chrome';
import PageHeader from '@/component/PageHeader';
import { thClass } from '@/component/table-styles';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link, useRouter } from '@/i18n/navigation';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { useDate } from '@/lib/data';
import { needsPaidPlan, shiftMonth, useCreatePayroll, usePayrollRuns } from '@/lib/payroll/hooks';
import { cn } from '@/lib/utils';
import { labelClass, outlineBtn, PayrollStatusBadge, PlanLocked, primaryBtn, useMonthLabel, usePayMoney } from '../employees/shared';

const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function PayrollView() {
  const user = useSession();
  const tErrors = useTranslations('ApiErrors');
  if (!can(user.role, 'payroll')) return <p className="text-muted text-sm">{tErrors('FORBIDDEN')}</p>;
  return <PayrollContent />;
}

function PayrollContent() {
  const t = useTranslations('Payroll');
  const money = usePayMoney();
  const monthLabel = useMonthLabel();
  const date = useDate();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const runs = usePayrollRuns();
  const [preparing, setPreparing] = useState(false);

  if (needsPaidPlan(runs.error)) return <PlanLocked />;
  const prepared = new Set(runs.data?.map((r) => r.month) ?? []);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <>
            <Link href="/employees" className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t('employees')}
            </Link>
            <Button type="button" onClick={() => setPreparing(true)} className={primaryBtn}>
              <Plus className="size-4" />
              {t('prepare')}
            </Button>
          </>
        }
      />

      <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
        {runs.isPending ? (
          <div className="text-muted flex justify-center py-14">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : runs.isError ? (
          <p className="text-danger px-4 py-14 text-center text-sm font-semibold">{errorMessage(runs.error)}</p>
        ) : runs.data.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <p className="text-ink text-sm font-bold">{t('empty')}</p>
            <p className="text-muted mx-auto mt-1 max-w-md text-xs leading-6">{t('emptyHint')}</p>
            <Button type="button" onClick={() => setPreparing(true)} className={cn(primaryBtn, 'mt-4')}>
              <CalendarPlus className="size-4" />
              {t('prepareFirst', { month: monthLabel(thisMonth()) })}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-canvas/60 border-line border-b">
                <tr>
                  <th className={thClass}>{t('columns.month')}</th>
                  <th className={thClass}>{t('columns.employees')}</th>
                  <th className={cn(thClass, 'text-end')}>{t('columns.net')}</th>
                  <th className={cn(thClass, 'text-end')}>{t('columns.cost')}</th>
                  <th className={thClass}>{t('columns.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {runs.data.map((r) => (
                  <tr key={r.id} onClick={() => router.push(`/payroll/${r.month}`)} className="hover:bg-canvas/60 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/payroll/${r.month}`} onClick={(e) => e.stopPropagation()} className="text-ink font-bold hover:underline">
                        {monthLabel(r.month)}
                      </Link>
                      {r.paidOn && <p className="text-muted mt-0.5 text-xs">{t('paidOn', { date: date(r.paidOn) })}</p>}
                    </td>
                    <td className="text-ink-2 px-4 py-3 tabular-nums">{r.employees}</td>
                    <td className="text-ink px-4 py-3 text-end font-bold tabular-nums whitespace-nowrap">{money(r.net)}</td>
                    <td className="text-ink-2 px-4 py-3 text-end tabular-nums whitespace-nowrap">{money(r.cost)}</td>
                    <td className="px-4 py-3">
                      <PayrollStatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PrepareDialog open={preparing} onClose={() => setPreparing(false)} prepared={prepared} />
    </div>
  );
}

function PrepareDialog({ open, onClose, prepared }: { open: boolean; onClose: () => void; prepared: Set<string> }) {
  const t = useTranslations('Payroll.prepareDialog');
  const monthLabel = useMonthLabel();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const create = useCreatePayroll();
  // The next month back to a year ago; the first one not prepared yet is picked.
  const months = Array.from({ length: 14 }, (_, i) => shiftMonth(thisMonth(), 1 - i));
  const [month, setMonth] = useState(() => months.find((m) => m <= thisMonth() && !prepared.has(m)) ?? thisMonth());

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (prepared.has(month)) {
      onClose();
      router.push(`/payroll/${month}`);
      return;
    }
    try {
      await create.mutateAsync(month);
      toast.success(t('done', { month: monthLabel(month) }));
      onClose();
      router.push(`/payroll/${month}`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className={cn(dialogPopup, 'sm:max-w-md')}>
        <div className={dialogHeaderBar()}>
          <span className={dialogIconTile()}>
            <CalendarPlus className="size-5" />
          </span>
          <DialogHeader className={dialogHeading}>
            <DialogTitle className={dialogTitle}>{t('title')}</DialogTitle>
            <DialogDescription className={dialogDescription}>{t('description')}</DialogDescription>
          </DialogHeader>
          <button type="button" onClick={onClose} aria-label={t('close')} className={dialogClose}>
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="px-6 py-5">
            <p id="prepare-month" className={labelClass}>
              {t('month')}
            </p>
            <div role="radiogroup" aria-labelledby="prepare-month" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {months.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={month === m}
                  onClick={() => setMonth(m)}
                  className={cn(
                    'rounded-btn relative h-11 border px-2 text-xs font-bold transition-colors',
                    month === m ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-2 hover:bg-canvas',
                  )}
                >
                  {monthLabel(m)}
                  {prepared.has(m) && <span className="bg-brand absolute end-1.5 top-1.5 size-1.5 rounded-full" />}
                </button>
              ))}
            </div>
            <p className="text-muted mt-3 text-xs leading-6">{prepared.has(month) ? t('alreadyPrepared') : t('hint')}</p>
          </div>
          <DialogFooter className={dialogFooterBar}>
            <Button type="button" variant="outline" onClick={onClose} className={dialogCancelButton}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={create.isPending} className={cn(dialogConfirmButton, 'bg-brand hover:bg-brand/90')}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              {prepared.has(month) ? t('open') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
