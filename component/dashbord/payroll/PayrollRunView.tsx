// component/dashbord/payroll/PayrollRunView.tsx
// One month's payroll: the totals, each employee's line (edited while a draft), and
// the steps: approve (a cost of the month), pay (from each one's account), payslips.
'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Loader2,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Printer,
  RefreshCw,
  RotateCcw,
  Trash2,
  Undo2,
  UserMinus,
  X,
} from 'lucide-react';
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
  dialogPopupPinned,
  dialogScrollBody,
  dialogTitle,
  dialogPopup,
} from '@/component/dialog-chrome';
import { ChipGroup, FieldError } from '@/component/form-parts';
import PageHeader from '@/component/PageHeader';
import StatCard from '@/component/StatCard';
import { thClass } from '@/component/table-styles';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { useDate } from '@/lib/data';
import {
  needsPaidPlan,
  num,
  useApprovePayroll,
  useDeletePayroll,
  useEmailPayslip,
  usePayPayroll,
  usePayrollRun,
  useRefreshPayroll,
  useRemovePayrollItem,
  useReopenPayroll,
  useUnpayPayroll,
  useUpdatePayrollItem,
  type PayAccount,
  type PayrollItem,
  type PayrollRun,
} from '@/lib/payroll/hooks';
import { printWithTitle } from '@/lib/print';
import { cn } from '@/lib/utils';
import { openWhatsApp, toWhatsAppNumber } from '@/lib/whatsapp';
import { fieldClass, labelClass, outlineBtn, PayrollStatusBadge, PlanLocked, primaryBtn, useMonthLabel, usePayMoney } from '../employees/shared';
import PayslipPrint, { payslipLines } from './PayslipPrint';

const MONEY = /^\d{1,12}(\.\d{1,2})?$/;

export default function PayrollRunView({ month }: { month: string }) {
  const user = useSession();
  const t = useTranslations('Payroll');
  const tErrors = useTranslations('ApiErrors');
  const query = usePayrollRun(month);
  if (!can(user.role, 'payroll')) return <p className="text-muted text-sm">{tErrors('FORBIDDEN')}</p>;
  if (needsPaidPlan(query.error)) return <PlanLocked />;
  if (query.isPending) {
    return (
      <div className="text-muted flex justify-center py-20">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="rounded-card border-line bg-surface mx-auto max-w-md space-y-3 border p-8 text-center shadow-sm">
        <h1 className="text-ink text-lg font-extrabold">{notFound ? t('notFound') : t('loadError')}</h1>
        <Link href="/payroll" className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
          {t('backToList')}
        </Link>
      </div>
    );
  }
  return <RunContent run={query.data} />;
}

type Confirm = 'approve' | 'reopen' | 'unpay' | 'delete' | null;

function RunContent({ run }: { run: PayrollRun }) {
  const t = useTranslations('Payroll');
  const locale = useLocale();
  const user = useSession();
  const money = usePayMoney();
  const monthLabel = useMonthLabel();
  const date = useDate();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const refresh = useRefreshPayroll();
  const approve = useApprovePayroll();
  const reopen = useReopenPayroll();
  const unpay = useUnpayPayroll();
  const remove = useDeletePayroll();
  const removeItem = useRemovePayrollItem();
  const email = useEmailPayslip();
  const [editing, setEditing] = useState<PayrollItem | null>(null);
  const [paying, setPaying] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [printing, setPrinting] = useState<PayrollItem[]>([]);
  const draft = run.status === 'draft';
  const label = monthLabel(run.month);
  const busy = refresh.isPending || approve.isPending || reopen.isPending || unpay.isPending || remove.isPending;

  const done = (message: string) => ({
    onSuccess: () => toast.success(message),
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });

  function print(items: PayrollItem[]) {
    setPrinting(items);
    // After the sheet renders.
    setTimeout(() => printWithTitle(items.length === 1 ? `Payslip-${run.month}-${items[0].employee.ref}` : `Payslips-${run.month}`), 50);
  }

  function whatsapp(item: PayrollItem) {
    const number = toWhatsAppNumber(item.employee.phone);
    if (!number) return void toast.error(t('toasts.noPhone', { name: item.name }));
    const { earn, off } = payslipLines(item);
    const line = (k: string, v: string) => `${k === 'absence' ? t('payslip.lines.absence', { days: item.absenceDays }) : t(`payslip.lines.${k}`)}: ${money(v)}`;
    const text = [
      t('whatsapp.greeting', { name: item.name }),
      t('whatsapp.intro', { month: label, company: user.company.name }),
      '',
      ...earn.map(([k, v]) => line(k, v)),
      ...off.map(([k, v]) => `− ${line(k, v)}`),
      '',
      `${t('payslip.net')}: ${money(item.net)}`,
    ].join('\n');
    openWhatsApp(number, text);
  }

  function emailSlip(item: PayrollItem) {
    if (!item.employee.email) return void toast.error(t('toasts.noEmail', { name: item.name }));
    email.mutate(
      { month: run.month, itemId: item.id, locale: locale === 'en' ? 'en' : 'ar' },
      { onSuccess: (r) => toast.success(t('toasts.emailed', { to: r.to })), onError: (error) => toast.error(errorMessage(error)) },
    );
  }

  const confirmText: Record<Exclude<Confirm, null>, { title: string; description: string; confirm: string }> = {
    approve: { title: t('confirm.approveTitle', { month: label }), description: t('confirm.approveDescription', { net: money(run.totals.net), cost: money(run.totals.cost) }), confirm: t('approve') },
    reopen: { title: t('confirm.reopenTitle'), description: t('confirm.reopenDescription'), confirm: t('reopen') },
    unpay: { title: t('confirm.unpayTitle'), description: t('confirm.unpayDescription'), confirm: t('unpay') },
    delete: { title: t('confirm.deleteTitle', { month: label }), description: t('confirm.deleteDescription'), confirm: t('delete') },
  };

  function confirmed() {
    const what = confirm;
    setConfirm(null);
    if (what === 'approve') approve.mutate(run.month, done(t('toasts.approved', { month: label })));
    if (what === 'reopen') reopen.mutate(run.month, done(t('toasts.reopened')));
    if (what === 'unpay') unpay.mutate(run.month, done(t('toasts.unpaid')));
    if (what === 'delete')
      remove.mutate(run.month, {
        onSuccess: () => {
          toast.success(t('toasts.deleted', { month: label }));
          router.replace('/payroll');
        },
        onError: (error) => toast.error(errorMessage(error)),
      });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('runTitle', { month: label })}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <PayrollStatusBadge status={run.status} />
            <span>{run.paidOn ? t('paidOn', { date: date(run.paidOn) }) : t(`stage.${run.status}`)}</span>
          </span>
        }
        actions={
          <>
            <Link href="/payroll" className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t('back')}
            </Link>
            {draft && (
              <>
                <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirm('delete')} className={cn(outlineBtn, 'text-danger hover:text-danger')}>
                  <Trash2 className="size-4" />
                  {t('delete')}
                </Button>
                <Button type="button" variant="outline" disabled={busy} onClick={() => refresh.mutate(run.month, done(t('toasts.refreshed')))} className={outlineBtn}>
                  {refresh.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  {t('refresh')}
                </Button>
                <Button type="button" disabled={busy || run.items.length === 0} onClick={() => setConfirm('approve')} className={primaryBtn}>
                  <CheckCircle2 className="size-4" />
                  {t('approve')}
                </Button>
              </>
            )}
            {!draft && (
              <Button type="button" variant="outline" onClick={() => print(run.items)} className={outlineBtn}>
                <Printer className="size-4" />
                {t('printAll')}
              </Button>
            )}
            {run.status === 'approved' && (
              <>
                <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirm('reopen')} className={outlineBtn}>
                  <RotateCcw className="size-4" />
                  {t('reopen')}
                </Button>
                <Button type="button" disabled={busy} onClick={() => setPaying(true)} className={primaryBtn}>
                  <Banknote className="size-4" />
                  {t('pay')}
                </Button>
              </>
            )}
            {run.status === 'paid' && (
              <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirm('unpay')} className={outlineBtn}>
                <Undo2 className="size-4" />
                {t('unpay')}
              </Button>
            )}
          </>
        }
      />

      {draft && run.missing.length > 0 && (
        <div className="rounded-btn flex flex-wrap items-center justify-between gap-3 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>{t('missing', { count: run.missing.length, names: run.missing.map((m) => m.name).join('، ') })}</span>
          <Button type="button" variant="outline" disabled={busy} onClick={() => refresh.mutate(run.month, done(t('toasts.refreshed')))} className={cn(outlineBtn, 'h-9')}>
            <RefreshCw className="size-4" />
            {t('refresh')}
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('totals.gross')} value={money(run.totals.gross)} hint={t('totals.employees', { count: run.items.length })} />
        <StatCard label={t('totals.deductions')} value={money(run.totals.deductions)} hint={t('totals.deductionsHint', {
            // The employees' share only: the company's share is a cost, not taken from their pay.
            insurance: money(run.items.reduce((sum, item) => sum + num(item.insurance), 0)),
            tax: money(run.totals.incomeTax),
          })} tone="danger" />
        <StatCard label={t('totals.net')} value={money(run.totals.net)} hint={t('totals.netHint', { bank: money(run.byAccount.bank), cash: money(run.byAccount.cashbox), wallet: money(run.byAccount.wallet) })} tone="brand" />
        <StatCard label={t('totals.cost')} value={money(run.totals.cost)} hint={t('totals.costHint', { date: date(run.accrualDate) })} />
      </div>

      <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
        {/* relative: the header's screen-reader-only label (absolute) stays inside the scroller instead of widening the page. */}
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-canvas/60 border-line border-b">
              <tr>
                <th className={thClass}>{t('columns.employee')}</th>
                <th className={cn(thClass, 'text-end')}>{t('columns.pay')}</th>
                <th className={cn(thClass, 'text-end')}>{t('columns.extra')}</th>
                <th className={cn(thClass, 'text-end')}>{t('columns.absence')}</th>
                <th className={cn(thClass, 'text-end')}>{t('columns.deductions')}</th>
                <th className={cn(thClass, 'text-end')}>{t('columns.net')}</th>
                <th className={thClass}>
                  <span className="sr-only">{t('columns.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {run.items.map((item) => {
                const extra = num(item.bonus) + num(item.overtime);
                const other = num(item.otherDeductions) + num(item.insurance) + num(item.incomeTax) + num(item.advanceDeduction);
                return (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-3">
                      <Link href={`/employees/${item.employee.id}`} className="text-ink font-bold hover:underline">
                        {item.name}
                      </Link>
                      <p className="text-muted mt-0.5 text-xs">
                        <span dir="ltr">{item.employee.ref}</span>
                        {item.jobTitle ? ` · ${item.jobTitle}` : ''}
                      </p>
                      {/* Joined or left this month: why the pay is a share of the usual. */}
                      {item.partMonth && (
                        <p className="mt-1 text-xs font-semibold text-amber-700">
                          {t('partMonth', { days: item.partMonth.days, of: item.partMonth.of })}
                        </p>
                      )}
                    </td>
                    <td className="text-ink-2 px-4 py-3 text-end tabular-nums whitespace-nowrap">{money(num(item.baseSalary) + num(item.allowances))}</td>
                    <td className="px-4 py-3 text-end tabular-nums whitespace-nowrap">{extra > 0 ? <span className="text-brand-deep font-semibold">+ {money(extra)}</span> : <span className="text-muted">—</span>}</td>
                    <td className="px-4 py-3 text-end tabular-nums whitespace-nowrap">
                      {num(item.absenceDeduction) > 0 ? (
                        <>
                          <span className="text-danger font-semibold">− {money(item.absenceDeduction)}</span>
                          <p className="text-muted text-[11px]">{t('absenceDays', { count: Number(item.absenceDays) })}</p>
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums whitespace-nowrap">{other > 0 ? <span className="text-danger font-semibold">− {money(other)}</span> : <span className="text-muted">—</span>}</td>
                    <td className="text-ink px-4 py-3 text-end text-base font-extrabold tabular-nums whitespace-nowrap">{money(item.net)}</td>
                    <td className="px-2 py-2 text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger aria-label={t('columns.actions')} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8')}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-line bg-surface text-ink shadow-float rounded-card min-w-44 p-1.5">
                          {draft ? (
                            <>
                              <DropdownMenuItem onClick={() => setEditing(item)} className="rounded-btn min-h-10 gap-2 px-3 font-semibold">
                                <Pencil className="text-muted size-4" />
                                {t('rowActions.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => removeItem.mutate({ month: run.month, itemId: item.id }, done(t('toasts.removed', { name: item.name })))}
                                className="rounded-btn text-danger min-h-10 gap-2 px-3 font-semibold"
                              >
                                <UserMinus className="size-4" />
                                {t('rowActions.remove')}
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => print([item])} className="rounded-btn min-h-10 gap-2 px-3 font-semibold">
                                <Printer className="text-muted size-4" />
                                {t('rowActions.print')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => emailSlip(item)} className="rounded-btn min-h-10 gap-2 px-3 font-semibold">
                                <Mail className="text-muted size-4" />
                                {t('rowActions.email')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => whatsapp(item)} className="rounded-btn min-h-10 gap-2 px-3 font-semibold">
                                <MessageCircle className="text-muted size-4" />
                                {t('rowActions.whatsapp')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {run.items.length === 0 && <p className="text-muted px-4 py-10 text-center text-sm">{t('noItems')}</p>}
      </div>

      {editing && <ItemDialog run={run} item={editing} onClose={() => setEditing(null)} />}
      <PayDialog open={paying} onClose={() => setPaying(false)} run={run} />
      <ConfirmDialog
        open={confirm !== null}
        icon={confirm === 'approve' ? CheckCircle2 : confirm === 'delete' ? Trash2 : RotateCcw}
        title={confirm ? confirmText[confirm].title : ''}
        description={confirm ? confirmText[confirm].description : ''}
        cancelLabel={t('confirm.cancel')}
        confirmLabel={confirm ? confirmText[confirm].confirm : ''}
        onClose={() => setConfirm(null)}
        onConfirm={confirmed}
      />
      <PayslipPrint run={run} items={printing} company={user.company.name} />
    </div>
  );
}

/** Editing one employee's line of a draft month. */
function ItemDialog({ run, item, onClose }: { run: PayrollRun; item: PayrollItem; onClose: () => void }) {
  const t = useTranslations('Payroll.item');
  const tAccounts = useTranslations('Employees.accounts');
  const money = usePayMoney();
  const errorMessage = useApiErrorMessage();
  const update = useUpdatePayrollItem();
  const zero = (v: string) => (num(v) === 0 ? '' : String(num(v)));
  const [values, setValues] = useState({
    bonus: zero(item.bonus),
    overtime: zero(item.overtime),
    otherDeductions: zero(item.otherDeductions),
    deductionNote: item.deductionNote ?? '',
    advanceDeduction: zero(item.advanceDeduction),
    note: item.note ?? '',
  });
  const [payAccount, setPayAccount] = useState<PayAccount>(item.payAccount);
  const [problem, setProblem] = useState<string | null>(null);
  const amount = (v: string) => (MONEY.test(v.trim()) ? Number(v) : 0);
  const gross = num(item.baseSalary) + num(item.allowances) + amount(values.bonus) + amount(values.overtime);
  const net =
    gross - num(item.absenceDeduction) - amount(values.otherDeductions) - num(item.insurance) - num(item.incomeTax) - amount(values.advanceDeduction);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    for (const key of ['bonus', 'overtime', 'otherDeductions', 'advanceDeduction'] as const) {
      if (values[key].trim() && !MONEY.test(values[key].trim())) return setProblem(t('errors.amount'));
    }
    if (net < 0) return setProblem(t('errors.negative'));
    try {
      await update.mutateAsync({
        month: run.month,
        itemId: item.id,
        edits: {
          bonus: values.bonus.trim() || '0',
          overtime: values.overtime.trim() || '0',
          otherDeductions: values.otherDeductions.trim() || '0',
          deductionNote: values.deductionNote,
          advanceDeduction: values.advanceDeduction.trim() || '0',
          payAccount,
          note: values.note,
        },
      });
      toast.success(t('saved', { name: item.name }));
      onClose();
    } catch (error) {
      setProblem(errorMessage(error));
    }
  }

  const input = (key: keyof typeof values, opts: { money?: boolean; placeholder?: string } = {}) => (
    <div className="min-w-0">
      <label htmlFor={`item-${key}`} className={labelClass}>
        {t(`fields.${key}`)}
      </label>
      <Input
        id={`item-${key}`}
        value={values[key]}
        onChange={(e) => {
          setValues((v) => ({ ...v, [key]: e.target.value }));
          setProblem(null);
        }}
        placeholder={opts.placeholder ?? (opts.money ? '0' : '')}
        {...(opts.money ? { inputMode: 'decimal' as const, dir: 'ltr' } : {})}
        className={cn(fieldClass, opts.money && 'tabular-nums rtl:text-right')}
      />
    </div>
  );

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className={cn(dialogPopupPinned, 'sm:max-w-lg')}>
        <div className={dialogHeaderBar()}>
          <span className={dialogIconTile()}>
            <Pencil className="size-5" />
          </span>
          <DialogHeader className={dialogHeading}>
            <DialogTitle className={dialogTitle}>{item.name}</DialogTitle>
            <DialogDescription className={dialogDescription}>{t('description')}</DialogDescription>
          </DialogHeader>
          <button type="button" onClick={onClose} aria-label={t('close')} className={dialogClose}>
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className={cn(dialogScrollBody, 'space-y-5 px-6 py-5')}>
            <dl className="bg-canvas/70 border-line grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-xl border px-4 py-3 text-xs">
              {([
                ['base', num(item.baseSalary) + num(item.allowances)],
                ['absence', -num(item.absenceDeduction)],
                ['insurance', -num(item.insurance)],
                ['tax', -num(item.incomeTax)],
              ] as const).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-3">
                  <dt className="text-muted">{key === 'absence' ? t('fixed.absence', { days: item.absenceDays }) : t(`fixed.${key}`)}</dt>
                  <dd className={cn('font-bold tabular-nums', value < 0 ? 'text-danger' : 'text-ink')}>{money(Math.abs(value))}</dd>
                </div>
              ))}
            </dl>
            <div className="grid gap-4 sm:grid-cols-2">
              {input('bonus', { money: true })}
              {input('overtime', { money: true })}
              {input('otherDeductions', { money: true })}
              {input('deductionNote', { placeholder: t('placeholders.deductionNote') })}
              {input('advanceDeduction', { money: true })}
            </div>
            <div>
              <p id="item-account" className={labelClass}>
                {t('fields.payAccount')}
              </p>
              <ChipGroup<PayAccount>
                labelId="item-account"
                value={payAccount}
                onChange={setPayAccount}
                options={(['bank', 'cashbox', 'wallet'] as const).map((a) => ({ value: a, label: tAccounts(a) }))}
                className="sm:grid-cols-3"
              />
            </div>
            {input('note')}
            <FieldError message={problem ?? undefined} />
          </div>
          <div className="border-line bg-canvas flex shrink-0 items-center justify-between gap-3 border-t px-6 py-4">
            <div>
              <p className="text-muted text-[11px] font-semibold">{t('net')}</p>
              <p className={cn('text-lg font-extrabold tabular-nums', net < 0 ? 'text-danger' : 'text-brand-deep')}>{money(net)}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className={dialogCancelButton}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={update.isPending} className={cn(dialogConfirmButton, 'bg-brand hover:bg-brand/90 px-6')}>
                {update.isPending && <Loader2 className="size-4 animate-spin" />}
                {t('save')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Paying an approved month: the day, and what goes out of each account. */
function PayDialog({ open, onClose, run }: { open: boolean; onClose: () => void; run: PayrollRun }) {
  const t = useTranslations('Payroll.payDialog');
  const tAccounts = useTranslations('Employees.accounts');
  const money = usePayMoney();
  const monthLabel = useMonthLabel();
  const errorMessage = useApiErrorMessage();
  const pay = usePayPayroll();
  const today = new Date().toISOString().slice(0, 10);
  const [paidOn, setPaidOn] = useState(today);
  const [problem, setProblem] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await pay.mutateAsync({ month: run.month, paidOn });
      toast.success(t('done', { month: monthLabel(run.month) }));
      onClose();
    } catch (error) {
      setProblem(errorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className={cn(dialogPopup, 'sm:max-w-md')}>
        <div className={dialogHeaderBar()}>
          <span className={dialogIconTile()}>
            <Banknote className="size-5" />
          </span>
          <DialogHeader className={dialogHeading}>
            <DialogTitle className={dialogTitle}>{t('title', { month: monthLabel(run.month) })}</DialogTitle>
            <DialogDescription className={dialogDescription}>{t('description')}</DialogDescription>
          </DialogHeader>
          <button type="button" onClick={onClose} aria-label={t('close')} className={dialogClose}>
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="space-y-4 px-6 py-5">
            <dl className="divide-line border-line divide-y rounded-xl border">
              {(['bank', 'cashbox', 'wallet'] as const)
                .filter((a) => num(run.byAccount[a]) > 0)
                .map((a) => (
                  <div key={a} className="flex justify-between gap-3 px-4 py-2.5 text-sm">
                    <dt className="text-ink-2">{t('from', { account: tAccounts(a) })}</dt>
                    <dd className="text-ink font-bold tabular-nums">{money(run.byAccount[a])}</dd>
                  </div>
                ))}
              <div className="bg-canvas/70 flex justify-between gap-3 px-4 py-3">
                <dt className="text-ink text-sm font-extrabold">{t('total')}</dt>
                <dd className="text-brand-deep text-base font-extrabold tabular-nums">{money(run.totals.net)}</dd>
              </div>
            </dl>
            <div>
              <label htmlFor="pay-date" className={labelClass}>
                {t('date')}
              </label>
              <DateField id="pay-date" value={paidOn} minDate={`${run.month}-01`} onChange={(v) => { setPaidOn(v); setProblem(null); }} placeholder={t('date')} />
              <p className="text-muted mt-1.5 text-xs leading-5">{t('dateHint')}</p>
            </div>
            <FieldError message={problem ?? undefined} />
          </div>
          <DialogFooter className={dialogFooterBar}>
            <Button type="button" variant="outline" onClick={onClose} className={dialogCancelButton}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={pay.isPending} className={cn(dialogConfirmButton, 'bg-brand hover:bg-brand/90')}>
              {pay.isPending && <Loader2 className="size-4 animate-spin" />}
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
