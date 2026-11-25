// component/dashbord/employees/EmployeeDetailView.tsx
// One employee: their details and pay, advances, attendance and leave, documents and
// payslips; editing, end of service (or back), and deleting someone with no history.
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, Pencil, RotateCcw, Trash2, UserX, X } from 'lucide-react';
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
import PageHeader from '@/component/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  useDeleteEmployee,
  useEmployee,
  useEndEmployee,
  useReactivateEmployee,
  type EmployeeDetail,
} from '@/lib/payroll/hooks';
import { cn } from '@/lib/utils';
import AdvancesCard from './AdvancesCard';
import AttendanceCard from './AttendanceCard';
import DocumentsCard from './DocumentsCard';
import EmployeeSheet from './EmployeeSheet';
import { cardClass, EmployeeStatusBadge, Fact, fieldClass, labelClass, outlineBtn, PayrollStatusBadge, PlanLocked, useMonthLabel, usePayMoney } from './shared';

export default function EmployeeDetailView({ id }: { id: string }) {
  const user = useSession();
  const tErrors = useTranslations('ApiErrors');
  const t = useTranslations('Employees');
  const [year, setYear] = useState<number | undefined>(undefined);
  const query = useEmployee(id, year);

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
        <Link href="/employees" className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
          {t('backToList')}
        </Link>
      </div>
    );
  }
  return <EmployeeContent employee={query.data} year={query.data.attendance.year} onYear={setYear} />;
}

function EmployeeContent({ employee, year, onYear }: { employee: EmployeeDetail; year: number; onYear: (y: number) => void }) {
  const t = useTranslations('Employees');
  const tAccounts = useTranslations('Employees.accounts');
  const money = usePayMoney();
  const monthLabel = useMonthLabel();
  const date = useDate();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const reactivate = useReactivateEmployee();
  const remove = useDeleteEmployee();
  const [editing, setEditing] = useState(false);
  const [ending, setEnding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const p = employee.pay;
  // Someone with pay history or advances ends their service instead (the server checks too).
  const deletable = employee.payslips.length === 0 && employee.advances.items.length === 0;

  type Row = [label: string, amount: string, sign: 'plus' | 'minus'];
  const payRows: Row[] = [
    [t('pay.baseSalary'), p.baseSalary, 'plus'],
    ...(num(p.allowances) > 0 ? [[t('pay.allowances'), p.allowances, 'plus'] as Row] : []),
    ...(num(p.insurance) > 0 ? [[t('pay.insurance'), p.insurance, 'minus'] as Row] : []),
    ...(num(p.incomeTax) > 0 ? [[t('pay.incomeTax'), p.incomeTax, 'minus'] as Row] : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={employee.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span dir="ltr">{employee.ref}</span>
            {employee.jobTitle && <span>· {employee.jobTitle}</span>}
            {employee.department && <span>· {employee.department}</span>}
            <EmployeeStatusBadge status={employee.status} />
          </span>
        }
        actions={
          <>
            <Link href="/employees" className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t('back')}
            </Link>
            <Button type="button" variant="outline" onClick={() => setEditing(true)} className={outlineBtn}>
              <Pencil className="size-4" />
              {t('edit')}
            </Button>
            {employee.status === 'active' ? (
              <Button type="button" variant="outline" onClick={() => setEnding(true)} className={cn(outlineBtn, 'text-danger hover:text-danger')}>
                <UserX className="size-4" />
                {t('end.action')}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={reactivate.isPending}
                onClick={() =>
                  reactivate.mutate(employee.id, {
                    onSuccess: () => toast.success(t('reactivated', { name: employee.name })),
                    onError: (error) => toast.error(errorMessage(error)),
                  })
                }
                className={outlineBtn}
              >
                <RotateCcw className="size-4" />
                {t('reactivate')}
              </Button>
            )}
            {deletable && (
              <Button type="button" variant="outline" onClick={() => setDeleting(true)} className={cn(outlineBtn, 'text-danger hover:text-danger')}>
                <Trash2 className="size-4" />
                {t('delete')}
              </Button>
            )}
          </>
        }
      />

      {employee.status === 'ended' && (
        <p className="rounded-btn border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('endedNotice', { date: date(employee.endDate!), reason: employee.endReason ?? '—' })}
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <section className={cardClass}>
            <h2 className="text-ink text-base font-extrabold">{t('pay.title')}</h2>
            <dl className="divide-line mt-3 divide-y">
              {payRows.map(([label, value, sign]) => (
                <div key={label} className="flex justify-between gap-4 py-2.5 text-sm">
                  <dt className="text-ink-2">{label}</dt>
                  <dd className={cn('font-bold tabular-nums', sign === 'minus' ? 'text-danger' : 'text-ink')}>
                    {sign === 'minus' ? '− ' : ''}
                    {money(value)}
                  </dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-ink text-sm font-extrabold">{t('pay.net')}</dt>
                <dd className="text-brand-deep text-lg font-extrabold tabular-nums">{money(p.net)}</dd>
              </div>
            </dl>
            <p className="text-muted bg-canvas/70 rounded-btn mt-2 px-3 py-2 text-xs leading-6">
              {t('pay.costNote', { cost: money(p.cost), employer: money(p.employerInsurance) })}
            </p>
          </section>

          <AttendanceCard employee={employee} year={year} onYear={onYear} />

          <section className={cardClass}>
            <h2 className="text-ink text-base font-extrabold">{t('payslips.title')}</h2>
            {employee.payslips.length === 0 ? (
              <p className="text-muted mt-4 text-sm">{t('payslips.empty')}</p>
            ) : (
              <ul className="divide-line mt-3 divide-y">
                {employee.payslips.map((s) => (
                  <li key={s.itemId} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/payroll/${s.month}`} className="text-ink text-sm font-bold hover:underline">
                      {monthLabel(s.month)}
                    </Link>
                    <span className="flex items-center gap-3">
                      <span className="text-ink text-sm font-bold tabular-nums">{money(s.net)}</span>
                      <PayrollStatusBadge status={s.status} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className={cardClass}>
            <h2 className="text-ink text-base font-extrabold">{t('info.title')}</h2>
            <dl className="divide-line mt-2 divide-y">
              <Fact label={t('info.hireDate')} value={date(employee.hireDate)} />
              <Fact label={t('info.phone')} value={employee.phone} dir="ltr" />
              <Fact label={t('info.email')} value={employee.email} dir="ltr" />
              <Fact label={t('info.nationalId')} value={employee.nationalId} dir="ltr" />
              <Fact label={t('info.address')} value={employee.address} dir="auto" />
              <Fact label={t('info.payAccount')} value={tAccounts(employee.payAccount)} />
              {employee.payAccount === 'bank' && <Fact label={t('info.bank')} value={[employee.bankName, employee.bankAccount].filter(Boolean).join(' · ') || null} dir="auto" />}
              {employee.payAccount === 'wallet' && <Fact label={t('info.wallet')} value={employee.walletNumber} dir="ltr" />}
              <Fact label={t('info.leaveDays')} value={t('info.leaveDaysValue', { days: employee.leaveDays })} />
            </dl>
            {employee.notes && <p className="text-muted bg-canvas/70 rounded-btn mt-3 px-3 py-2 text-xs leading-6 whitespace-pre-line">{employee.notes}</p>}
          </section>
          <AdvancesCard employee={employee} />
          <DocumentsCard employee={employee} />
        </aside>
      </div>

      <EmployeeSheet open={editing} onOpenChange={setEditing} employee={employee} departments={[]} />
      <EndServiceDialog open={ending} onClose={() => setEnding(false)} employee={employee} />
      <ConfirmDialog
        open={deleting}
        title={t('deleteTitle', { name: employee.name })}
        description={t('deleteDescription')}
        cancelLabel={t('keep')}
        confirmLabel={t('deleteConfirm')}
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          setDeleting(false);
          remove.mutate(employee.id, {
            onSuccess: () => {
              toast.success(t('deleted', { name: employee.name }));
              router.replace('/employees');
            },
            onError: (error) => toast.error(errorMessage(error)),
          });
        }}
      />
    </div>
  );
}

function EndServiceDialog({ open, onClose, employee }: { open: boolean; onClose: () => void; employee: EmployeeDetail }) {
  const t = useTranslations('Employees.end');
  const errorMessage = useApiErrorMessage();
  const end = useEndEmployee();
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await end.mutateAsync({ id: employee.id, endDate, reason: reason.trim() });
      toast.success(t('done', { name: employee.name }));
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className={cn(dialogPopup, 'sm:max-w-md')}>
        <div className={dialogHeaderBar('danger')}>
          <span className={dialogIconTile('danger')}>
            <UserX className="size-5" />
          </span>
          <DialogHeader className={dialogHeading}>
            <DialogTitle className={dialogTitle}>{t('title', { name: employee.name })}</DialogTitle>
            <DialogDescription className={dialogDescription}>{t('description')}</DialogDescription>
          </DialogHeader>
          <button type="button" onClick={onClose} aria-label={t('close')} className={dialogClose}>
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="space-y-4 px-6 py-5">
            <div>
              <label htmlFor="end-date" className={labelClass}>
                {t('date')}
              </label>
              <DateField id="end-date" value={endDate} minDate={employee.hireDate} onChange={setEndDate} placeholder={t('date')} />
            </div>
            <div>
              <label htmlFor="end-reason" className={labelClass}>
                {t('reason')}
              </label>
              <Input id="end-reason" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder={t('reasonPlaceholder')} className={fieldClass} />
            </div>
          </div>
          <DialogFooter className={dialogFooterBar}>
            <Button type="button" variant="outline" onClick={onClose} className={dialogCancelButton}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={end.isPending} className={cn(dialogConfirmButton, 'bg-danger hover:bg-danger/90')}>
              {end.isPending && <Loader2 className="size-4 animate-spin" />}
              {t('confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
