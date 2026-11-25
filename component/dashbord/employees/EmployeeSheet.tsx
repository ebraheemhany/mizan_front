// component/dashbord/employees/EmployeeSheet.tsx
// Adding or editing an employee: who they are, their monthly pay (with what it comes
// to), how they are paid, and their paid-leave days.
'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, UserPlus, UserPen, X } from 'lucide-react';
import { toast } from 'sonner';

import DateField from '@/component/DateField';
import {
  dialogCancelButton,
  dialogClose,
  dialogConfirmButton,
  dialogDescription,
  dialogHeading,
  dialogIconTile,
  dialogScrollBody,
  dialogTitle,
  sheetFooterBar,
  sheetHeaderBar,
  sheetPopup,
} from '@/component/dialog-chrome';
import { ChipGroup, FieldError } from '@/component/form-parts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { rtlLocales } from '@/i18n/routing';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import {
  num,
  useCreateEmployee,
  useUpdateEmployee,
  type Employee,
  type EmployeeInput,
  type PayAccount,
} from '@/lib/payroll/hooks';
import { cn } from '@/lib/utils';
import { fieldClass, labelClass, usePayMoney } from './shared';

const MONEY = /^\d{1,12}(\.\d{1,2})?$/;
const today = () => new Date().toISOString().slice(0, 10);

function initialValues(employee: Employee | null): EmployeeInput {
  if (!employee) {
    return {
      name: '',
      jobTitle: '',
      department: '',
      phone: '',
      email: '',
      nationalId: '',
      address: '',
      hireDate: today(),
      baseSalary: '',
      allowances: '',
      insurance: '',
      employerInsurance: '',
      incomeTax: '',
      payAccount: 'bank',
      bankName: '',
      bankAccount: '',
      walletNumber: '',
      leaveDays: 21,
      notes: '',
    };
  }
  const zero = (v: string) => (num(v) === 0 ? '' : String(num(v)));
  return {
    name: employee.name,
    jobTitle: employee.jobTitle ?? '',
    department: employee.department ?? '',
    phone: employee.phone ?? '',
    email: employee.email ?? '',
    nationalId: employee.nationalId ?? '',
    address: employee.address ?? '',
    hireDate: employee.hireDate,
    baseSalary: String(num(employee.pay.baseSalary)),
    allowances: zero(employee.pay.allowances),
    insurance: zero(employee.pay.insurance),
    employerInsurance: zero(employee.pay.employerInsurance),
    incomeTax: zero(employee.pay.incomeTax),
    payAccount: employee.payAccount,
    bankName: employee.bankName ?? '',
    bankAccount: employee.bankAccount ?? '',
    walletNumber: employee.walletNumber ?? '',
    leaveDays: employee.leaveDays,
    notes: employee.notes ?? '',
  };
}

type Problems = Partial<Record<keyof EmployeeInput, string>>;

export default function EmployeeSheet({
  open,
  onOpenChange,
  employee,
  departments,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null: a new employee. */
  employee: Employee | null;
  departments: string[];
  onSaved?: (employee: Employee) => void;
}) {
  const t = useTranslations('Employees.sheet');
  const locale = useLocale();
  const Icon = employee ? UserPen : UserPlus;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={rtlLocales.includes(locale) ? 'left' : 'right'}
        showCloseButton={false}
        className={cn(sheetPopup, 'sm:max-w-xl')}
      >
        <SheetHeader className={sheetHeaderBar()}>
          <span className={dialogIconTile()}>
            <Icon className="size-5" />
          </span>
          <div className={dialogHeading}>
            <SheetTitle className={dialogTitle}>{t(employee ? 'editTitle' : 'title')}</SheetTitle>
            <SheetDescription className={dialogDescription}>{t('description')}</SheetDescription>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label={t('close')} className={dialogClose}>
            <X className="size-4" />
          </button>
        </SheetHeader>
        {open && (
          <EmployeeForm
            key={employee?.id ?? 'new'}
            employee={employee}
            departments={departments}
            onDone={(saved) => {
              onOpenChange(false);
              onSaved?.(saved);
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function EmployeeForm({
  employee,
  departments,
  onDone,
  onCancel,
}: {
  employee: Employee | null;
  departments: string[];
  onDone: (employee: Employee) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('Employees.sheet');
  const tAccounts = useTranslations('Employees.accounts');
  const money = usePayMoney();
  const errorMessage = useApiErrorMessage();
  const create = useCreateEmployee();
  const update = useUpdateEmployee();
  const [values, setValues] = useState<EmployeeInput>(() => initialValues(employee));
  const [problems, setProblems] = useState<Problems>({});
  const busy = create.isPending || update.isPending;

  const set =
    <K extends keyof EmployeeInput>(key: K) =>
    (value: EmployeeInput[K]) => {
      setValues((v) => ({ ...v, [key]: value }));
      setProblems((p) => ({ ...p, [key]: undefined }));
    };
  const text = (key: keyof EmployeeInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    set(key)(e.target.value as never);

  // What the month comes to, as typed.
  const amount = (v: string) => (MONEY.test(v.trim()) ? Number(v) : 0);
  const gross = amount(values.baseSalary) + amount(values.allowances);
  const net = gross - amount(values.insurance) - amount(values.incomeTax);
  const cost = gross + amount(values.employerInsurance);

  function check(): Problems {
    const found: Problems = {};
    if (values.name.trim().length < 2) found.name = t('errors.name');
    if (!values.hireDate) found.hireDate = t('errors.hireDate');
    if (!MONEY.test(values.baseSalary.trim()) || Number(values.baseSalary) <= 0) found.baseSalary = t('errors.salary');
    for (const key of ['allowances', 'insurance', 'employerInsurance', 'incomeTax'] as const) {
      if (values[key].trim() && !MONEY.test(values[key].trim())) found[key] = t('errors.amount');
    }
    if (!found.insurance && net < 0) found.insurance = t('errors.deductions');
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) found.email = t('errors.email');
    return found;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = check();
    setProblems(found);
    if (Object.values(found).some(Boolean)) return;
    const input = { ...values, name: values.name.trim() };
    try {
      const saved = employee
        ? await update.mutateAsync({ id: employee.id, input })
        : await create.mutateAsync(input);
      toast.success(t(employee ? 'updated' : 'added', { name: saved.name }));
      onDone(saved);
    } catch (error) {
      const field = error instanceof ApiError ? Object.keys(error.details?.fieldErrors ?? {})[0] : undefined;
      if (field && field in values) setProblems({ [field]: errorMessage(error) });
      toast.error(errorMessage(error));
    }
  }

  const field = (key: keyof EmployeeInput, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="min-w-0">
      <label htmlFor={`emp-${key}`} className={labelClass}>
        {t(`fields.${key}`)}
      </label>
      <Input
        id={`emp-${key}`}
        value={String(values[key])}
        onChange={text(key)}
        aria-invalid={!!problems[key]}
        className={fieldClass}
        {...props}
      />
      <FieldError message={problems[key]} />
    </div>
  );
  const moneyField = (key: keyof EmployeeInput) =>
    field(key, { inputMode: 'decimal', dir: 'ltr', placeholder: '0', className: cn(fieldClass, 'tabular-nums rtl:text-right') });

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className={cn(dialogScrollBody, 'space-y-6 px-6 py-5')}>
        <section className="space-y-4">
          <h3 className="text-muted text-xs font-extrabold tracking-wide">{t('sections.person')}</h3>
          {field('name', { autoFocus: !employee, placeholder: t('placeholders.name') })}
          <div className="grid gap-4 sm:grid-cols-2">
            {field('jobTitle', { placeholder: t('placeholders.jobTitle') })}
            <div className="min-w-0">
              <label htmlFor="emp-department" className={labelClass}>
                {t('fields.department')}
              </label>
              <Input
                id="emp-department"
                list="emp-departments"
                value={values.department}
                onChange={text('department')}
                placeholder={t('placeholders.department')}
                className={fieldClass}
              />
              <datalist id="emp-departments">
                {departments.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('phone', { dir: 'ltr', inputMode: 'tel', placeholder: '010 1234 5678', className: cn(fieldClass, 'rtl:text-right') })}
            {field('email', { dir: 'ltr', type: 'email', placeholder: 'name@company.com', className: cn(fieldClass, 'rtl:text-right') })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('nationalId', { inputMode: 'numeric', placeholder: t('placeholders.nationalId') })}
            <div className="min-w-0">
              <label htmlFor="emp-hireDate" className={labelClass}>
                {t('fields.hireDate')}
              </label>
              <DateField id="emp-hireDate" value={values.hireDate} onChange={set('hireDate')} placeholder={t('placeholders.date')} invalid={!!problems.hireDate} />
              <FieldError message={problems.hireDate} />
            </div>
          </div>
          {field('address', { placeholder: t('placeholders.address') })}
        </section>

        <section className="space-y-4">
          <h3 className="text-muted text-xs font-extrabold tracking-wide">{t('sections.pay')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {moneyField('baseSalary')}
            {moneyField('allowances')}
            {moneyField('insurance')}
            {moneyField('incomeTax')}
            {moneyField('employerInsurance')}
          </div>
          <p className="text-muted text-xs leading-6">{t('payHint')}</p>
          <dl className="bg-canvas/70 border-line divide-line grid grid-cols-3 divide-x overflow-hidden rounded-xl border text-center">
            {([
              ['gross', gross],
              ['net', net],
              ['cost', cost],
            ] as const).map(([key, value]) => (
              <div key={key} className="px-3 py-3">
                <dt className="text-muted text-[11px] font-semibold">{t(`preview.${key}`)}</dt>
                <dd className={cn('mt-1 text-sm font-extrabold tabular-nums', key === 'net' ? 'text-brand-deep' : 'text-ink')}>
                  {money(value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="space-y-4">
          <h3 id="emp-account-label" className="text-muted text-xs font-extrabold tracking-wide">
            {t('sections.account')}
          </h3>
          <ChipGroup<PayAccount>
            labelId="emp-account-label"
            value={values.payAccount}
            onChange={set('payAccount')}
            options={(['bank', 'cashbox', 'wallet'] as const).map((a) => ({ value: a, label: tAccounts(a) }))}
            className="sm:grid-cols-3"
          />
          {values.payAccount === 'bank' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {field('bankName', { placeholder: t('placeholders.bankName') })}
              {field('bankAccount', { dir: 'ltr', placeholder: 'EG38 0019 …', className: cn(fieldClass, 'rtl:text-right') })}
            </div>
          )}
          {values.payAccount === 'wallet' &&
            field('walletNumber', { dir: 'ltr', inputMode: 'tel', placeholder: '010 1234 5678', className: cn(fieldClass, 'rtl:text-right') })}
        </section>

        <section className="space-y-4">
          <h3 className="text-muted text-xs font-extrabold tracking-wide">{t('sections.other')}</h3>
          <div className="max-w-48">
            {field('leaveDays', {
              inputMode: 'numeric',
              value: String(values.leaveDays),
              onChange: (e) => set('leaveDays')(Number(e.target.value.replace(/\D/g, '').slice(0, 2) || 0)),
            })}
          </div>
          <div>
            <label htmlFor="emp-notes" className={labelClass}>
              {t('fields.notes')}
            </label>
            <Textarea id="emp-notes" rows={3} value={values.notes} onChange={text('notes')} className={cn(fieldClass, 'h-auto resize-none')} />
          </div>
        </section>
      </div>

      <div className={sheetFooterBar}>
        <Button type="button" variant="outline" onClick={onCancel} className={dialogCancelButton}>
          {t('cancel')}
        </Button>
        <Button type="submit" disabled={busy} className={cn(dialogConfirmButton, 'bg-brand hover:bg-brand/90')}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {t(employee ? 'save' : 'submit')}
        </Button>
      </div>
    </form>
  );
}
