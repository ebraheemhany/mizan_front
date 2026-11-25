// component/dashbord/employees/AttendanceCard.tsx
// A year's attendance: the paid-leave balance, absence and leave entries, and adding
// one (absence and unpaid leave come off that month's pay).
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarX2, ChevronLeft, ChevronRight, Loader2, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import DateField from '@/component/DateField';
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
import { FieldError } from '@/component/form-parts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useDate } from '@/lib/data';
import { useAddAttendance, useDeleteAttendance, type AttendanceKind, type EmployeeDetail } from '@/lib/payroll/hooks';
import { cn } from '@/lib/utils';
import { cardClass, fieldClass, labelClass, outlineBtn } from './shared';

const KINDS: AttendanceKind[] = ['absence', 'annualLeave', 'casualLeave', 'sickLeave', 'unpaidLeave'];
const KIND_STYLE: Record<AttendanceKind, string> = {
  absence: 'bg-danger-soft text-danger',
  unpaidLeave: 'bg-amber-100 text-amber-800',
  annualLeave: 'bg-brand-soft text-brand-deep',
  casualLeave: 'bg-brand-soft text-brand-deep',
  sickLeave: 'bg-info-soft text-info',
};

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;

export default function AttendanceCard({
  employee,
  year,
  onYear,
}: {
  employee: EmployeeDetail;
  year: number;
  onYear: (year: number) => void;
}) {
  const t = useTranslations('Employees.attendance');
  const tKinds = useTranslations('Employees.attendance.kinds');
  const date = useDate();
  const errorMessage = useApiErrorMessage();
  const remove = useDeleteAttendance();
  const [adding, setAdding] = useState(false);
  const { summary, items } = employee.attendance;
  const thisYear = new Date().getFullYear();

  return (
    <section className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>
          <div className="text-muted mt-1 flex items-center gap-1 text-xs">
            <button type="button" onClick={() => onYear(year - 1)} aria-label={t('previousYear')} className="hover:text-ink rounded p-0.5">
              <ChevronRight className="size-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
            <span className="text-ink font-bold tabular-nums">{year}</span>
            <button
              type="button"
              onClick={() => onYear(year + 1)}
              disabled={year >= thisYear}
              aria-label={t('nextYear')}
              className="hover:text-ink rounded p-0.5 disabled:opacity-30"
            >
              <ChevronLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={() => setAdding(true)} className={cn(outlineBtn, 'h-9')}>
          <Plus className="size-4" />
          {t('add')}
        </Button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          ['remaining', `${summary.remaining} / ${summary.allowed}`, 'text-brand-deep'],
          ['sick', summary.sick, 'text-info'],
          ['unpaid', summary.unpaid, 'text-amber-700'],
          ['absence', summary.absence, 'text-danger'],
        ] as const).map(([key, value, tone]) => (
          <div key={key} className="bg-canvas/70 border-line rounded-xl border px-3 py-2.5">
            <dt className="text-muted text-[11px] font-semibold">{t(`summary.${key}`)}</dt>
            <dd className={cn('mt-0.5 text-base font-extrabold tabular-nums', tone)} dir="ltr">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {items.length === 0 ? (
        <p className="text-muted mt-5 text-sm">{t('empty')}</p>
      ) : (
        <ul className="divide-line mt-4 divide-y">
          {items.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap', KIND_STYLE[entry.kind])}>
                  {tKinds(entry.kind)}
                </span>
                <div className="min-w-0">
                  <p className="text-ink text-sm font-semibold">
                    {entry.from === entry.to ? date(entry.from) : `${date(entry.from)} – ${date(entry.to)}`}
                  </p>
                  <p className="text-muted truncate text-xs">
                    {t('days', { count: Number(entry.days) })}
                    {entry.note ? ` · ${entry.note}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label={t('remove')}
                onClick={() =>
                  remove.mutate(
                    { id: employee.id, entryId: entry.id },
                    { onSuccess: () => toast.success(t('removed')), onError: (error) => toast.error(errorMessage(error)) },
                  )
                }
                className="text-muted hover:text-danger hover:bg-danger-soft shrink-0 rounded-lg p-1.5 transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={adding} onOpenChange={(v) => !v && setAdding(false)}>
        <DialogContent showCloseButton={false} className={cn(dialogPopup, 'sm:max-w-md')}>
          <div className={dialogHeaderBar()}>
            <span className={dialogIconTile()}>
              <CalendarX2 className="size-5" />
            </span>
            <DialogHeader className={dialogHeading}>
              <DialogTitle className={dialogTitle}>{t('dialogTitle')}</DialogTitle>
              <DialogDescription className={dialogDescription}>{t('dialogDescription', { name: employee.name })}</DialogDescription>
            </DialogHeader>
            <button type="button" onClick={() => setAdding(false)} aria-label={t('close')} className={dialogClose}>
              <X className="size-4" />
            </button>
          </div>
          {adding && <AttendanceForm employee={employee} onDone={() => setAdding(false)} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function AttendanceForm({ employee, onDone }: { employee: EmployeeDetail; onDone: () => void }) {
  const t = useTranslations('Employees.attendance');
  const tKinds = useTranslations('Employees.attendance.kinds');
  const errorMessage = useApiErrorMessage();
  const add = useAddAttendance();
  const today = new Date().toISOString().slice(0, 10);
  const [kind, setKind] = useState<AttendanceKind>('absence');
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [days, setDays] = useState('');
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const span = from && to && to >= from ? daysBetween(from, to) : 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!from || !to || to < from) return setProblem(t('errors.dates'));
    if (from.slice(0, 7) !== to.slice(0, 7)) return setProblem(t('errors.month'));
    if (days && (!/^\d{1,2}(\.5)?$/.test(days) || Number(days) <= 0 || Number(days) > span)) return setProblem(t('errors.days'));
    try {
      await add.mutateAsync({ id: employee.id, input: { kind, from, to, days, note } });
      toast.success(t('added'));
      onDone();
    } catch (error) {
      setProblem(errorMessage(error));
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-4 px-6 py-5">
        <div>
          <p id="att-kind" className={labelClass}>
            {t('kind')}
          </p>
          <div role="radiogroup" aria-labelledby="att-kind" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={cn(
                  'rounded-btn h-10 border px-2 text-xs font-bold transition-colors',
                  kind === k ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-2 hover:bg-canvas',
                )}
              >
                {tKinds(k)}
              </button>
            ))}
          </div>
          <p className="text-muted mt-2 text-xs leading-5">{t(`hints.${kind}`)}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="att-from" className={labelClass}>
              {t('from')}
            </label>
            <DateField
              id="att-from"
              value={from}
              onChange={(v) => {
                setFrom(v);
                if (!to || to < v || to.slice(0, 7) !== v.slice(0, 7)) setTo(v);
                setProblem(null);
              }}
              placeholder={t('from')}
            />
          </div>
          <div>
            <label htmlFor="att-to" className={labelClass}>
              {t('to')}
            </label>
            <DateField id="att-to" value={to} minDate={from} onChange={(v) => { setTo(v); setProblem(null); }} placeholder={t('to')} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="att-days" className={labelClass}>
              {t('daysLabel')}
            </label>
            <Input id="att-days" inputMode="decimal" dir="ltr" value={days} placeholder={String(span || 1)} onChange={(e) => setDays(e.target.value)} className={cn(fieldClass, 'tabular-nums rtl:text-right')} />
            <p className="text-muted mt-1 text-[11px]">{t('daysHint')}</p>
          </div>
          <div>
            <label htmlFor="att-note" className={labelClass}>
              {t('note')}
            </label>
            <Input id="att-note" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} className={fieldClass} />
          </div>
        </div>
        <FieldError message={problem ?? undefined} />
      </div>
      <DialogFooter className={dialogFooterBar}>
        <Button type="button" variant="outline" onClick={onDone} className={dialogCancelButton}>
          {t('cancel')}
        </Button>
        <Button type="submit" disabled={add.isPending} className={cn(dialogConfirmButton, 'bg-brand hover:bg-brand/90')}>
          {add.isPending && <Loader2 className="size-4 animate-spin" />}
          {t('submit')}
        </Button>
      </DialogFooter>
    </form>
  );
}
