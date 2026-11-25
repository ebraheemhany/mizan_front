// component/dashbord/employees/AdvancesCard.tsx
// An employee's advances: what is still owed, each advance with what's left of it,
// and paying a new one (the installment comes off each month's pay).
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { HandCoins, Loader2, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import ConfirmDialog from '@/component/ConfirmDialog';
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
import { ChipGroup, FieldError } from '@/component/form-parts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useDate } from '@/lib/data';
import { num, useAddAdvance, useDeleteAdvance, type EmployeeDetail, type PayAccount } from '@/lib/payroll/hooks';
import { cn } from '@/lib/utils';
import { cardClass, fieldClass, labelClass, outlineBtn, usePayMoney } from './shared';

const MONEY = /^\d{1,12}(\.\d{1,2})?$/;

export default function AdvancesCard({ employee }: { employee: EmployeeDetail }) {
  const t = useTranslations('Employees.advances');
  const tAccounts = useTranslations('Employees.accounts');
  const money = usePayMoney();
  const date = useDate();
  const errorMessage = useApiErrorMessage();
  const remove = useDeleteAdvance();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<EmployeeDetail['advances']['items'][number] | null>(null);
  const active = employee.status === 'active';

  return (
    <section className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>
          <p className="text-muted mt-1 text-xs">{t('outstanding', { amount: money(employee.advances.outstanding) })}</p>
        </div>
        {active && (
          <Button type="button" variant="outline" onClick={() => setAdding(true)} className={cn(outlineBtn, 'h-9')}>
            <Plus className="size-4" />
            {t('add')}
          </Button>
        )}
      </div>

      {employee.advances.items.length === 0 ? (
        <p className="text-muted mt-5 text-sm">{t('empty')}</p>
      ) : (
        <ul className="divide-line mt-4 divide-y">
          {employee.advances.items.map((a) => {
            const done = num(a.remaining) === 0;
            const share = num(a.amount) > 0 ? (num(a.repaid) / num(a.amount)) * 100 : 0;
            return (
              <li key={a.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-ink text-sm font-bold tabular-nums">{money(a.amount)}</p>
                    <p className="text-muted mt-0.5 text-xs">
                      {date(a.date)} · {tAccounts(a.paidFrom)} · {t('installment', { amount: money(a.installment) })}
                    </p>
                    {a.note && <p className="text-muted mt-0.5 truncate text-xs">{a.note}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn('text-xs font-bold tabular-nums', done ? 'text-brand-deep' : 'text-amber-700')}>
                      {done ? t('repaid') : t('left', { amount: money(a.remaining) })}
                    </span>
                    {num(a.repaid) === 0 && (
                      <button
                        type="button"
                        onClick={() => setRemoving(a)}
                        aria-label={t('remove')}
                        className="text-muted hover:text-danger hover:bg-danger-soft rounded-lg p-1.5 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-neutral-soft mt-2 h-1.5 overflow-hidden rounded-full">
                  <div className="bg-brand h-full rounded-full" style={{ width: `${share}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AdvanceDialog open={adding} onClose={() => setAdding(false)} employee={employee} />

      <ConfirmDialog
        open={removing !== null}
        title={t('removeTitle')}
        description={removing ? t('removeDescription', { amount: money(removing.amount) }) : ''}
        cancelLabel={t('keep')}
        confirmLabel={t('removeConfirm')}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          const target = removing;
          setRemoving(null);
          if (!target) return;
          remove.mutate(
            { id: employee.id, advanceId: target.id },
            { onSuccess: () => toast.success(t('removed')), onError: (error) => toast.error(errorMessage(error)) },
          );
        }}
      />
    </section>
  );
}

function AdvanceDialog({ open, onClose, employee }: { open: boolean; onClose: () => void; employee: EmployeeDetail }) {
  const t = useTranslations('Employees.advances');
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className={cn(dialogPopup, 'sm:max-w-md')}>
        <div className={dialogHeaderBar()}>
          <span className={dialogIconTile()}>
            <HandCoins className="size-5" />
          </span>
          <DialogHeader className={dialogHeading}>
            <DialogTitle className={dialogTitle}>{t('dialogTitle')}</DialogTitle>
            <DialogDescription className={dialogDescription}>{t('dialogDescription', { name: employee.name })}</DialogDescription>
          </DialogHeader>
          <button type="button" onClick={onClose} aria-label={t('close')} className={dialogClose}>
            <X className="size-4" />
          </button>
        </div>
        {open && <AdvanceForm employee={employee} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function AdvanceForm({ employee, onDone }: { employee: EmployeeDetail; onDone: () => void }) {
  const t = useTranslations('Employees.advances');
  const tAccounts = useTranslations('Employees.accounts');
  const money = usePayMoney();
  const errorMessage = useApiErrorMessage();
  const add = useAddAdvance();
  const [amount, setAmount] = useState('');
  const [installment, setInstallment] = useState('');
  const [day, setDay] = useState(new Date().toISOString().slice(0, 10));
  const [paidFrom, setPaidFrom] = useState<PayAccount>(employee.payAccount === 'bank' ? 'bank' : 'cashbox');
  const [note, setNote] = useState('');
  const [problems, setProblems] = useState<{ amount?: string; installment?: string }>({});

  const months = MONEY.test(amount) && MONEY.test(installment) && Number(installment) > 0 ? Math.ceil(Number(amount) / Number(installment)) : null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = {
      ...(!MONEY.test(amount.trim()) || Number(amount) <= 0 ? { amount: t('errors.amount') } : {}),
      ...(!MONEY.test(installment.trim()) || Number(installment) <= 0
        ? { installment: t('errors.amount') }
        : Number(installment) > Number(amount)
          ? { installment: t('errors.installment') }
          : {}),
    };
    setProblems(found);
    if (found.amount || found.installment) return;
    try {
      await add.mutateAsync({ id: employee.id, input: { amount: amount.trim(), installment: installment.trim(), date: day, paidFrom, note } });
      toast.success(t('added', { amount: money(amount), name: employee.name }));
      onDone();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-4 px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="adv-amount" className={labelClass}>
              {t('amount')}
            </label>
            <Input id="adv-amount" inputMode="decimal" dir="ltr" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!!problems.amount} className={cn(fieldClass, 'tabular-nums rtl:text-right')} />
            <FieldError message={problems.amount} />
          </div>
          <div>
            <label htmlFor="adv-installment" className={labelClass}>
              {t('installmentLabel')}
            </label>
            <Input id="adv-installment" inputMode="decimal" dir="ltr" value={installment} onChange={(e) => setInstallment(e.target.value)} aria-invalid={!!problems.installment} className={cn(fieldClass, 'tabular-nums rtl:text-right')} />
            <FieldError message={problems.installment} />
          </div>
        </div>
        {months !== null && <p className="text-muted text-xs">{t('months', { count: months })}</p>}
        <div>
          <label htmlFor="adv-date" className={labelClass}>
            {t('date')}
          </label>
          <DateField id="adv-date" value={day} onChange={setDay} placeholder={t('date')} />
        </div>
        <div>
          <p id="adv-from" className={labelClass}>
            {t('paidFrom')}
          </p>
          <ChipGroup<PayAccount>
            labelId="adv-from"
            value={paidFrom}
            onChange={setPaidFrom}
            options={(['bank', 'cashbox', 'wallet'] as const).map((a) => ({ value: a, label: tAccounts(a) }))}
            className="sm:grid-cols-3"
          />
        </div>
        <div>
          <label htmlFor="adv-note" className={labelClass}>
            {t('note')}
          </label>
          <Input id="adv-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder={t('notePlaceholder')} className={fieldClass} />
        </div>
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
