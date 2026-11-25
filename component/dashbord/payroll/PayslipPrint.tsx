// component/dashbord/payroll/PayslipPrint.tsx
// Payslips for printing (or saving as PDF): one page each. Hidden on screen; mounted
// under <body> as #print-root, which the print styles show alone.
'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Scale } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useDate } from '@/lib/data';
import { num, type PayrollItem, type PayrollRun } from '@/lib/payroll/hooks';
import { useMonthLabel, usePayMoney } from '../employees/shared';

const subscribe = () => () => {};

/** The lines of a payslip: earnings, then deductions (only what applies), then the net. */
export function payslipLines(item: PayrollItem) {
  const earn = [
    ['base', item.baseSalary],
    ['allowances', item.allowances],
    ['bonus', item.bonus],
    ['overtime', item.overtime],
  ].filter(([k, v]) => k === 'base' || num(v) > 0) as [string, string][];
  const off = [
    ['absence', item.absenceDeduction],
    ['other', item.otherDeductions],
    ['insurance', item.insurance],
    ['tax', item.incomeTax],
    ['advance', item.advanceDeduction],
  ].filter(([, v]) => num(v) > 0) as [string, string][];
  return { earn, off };
}

export default function PayslipPrint({ run, items, company }: { run: PayrollRun; items: PayrollItem[]; company: string }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!mounted || items.length === 0) return null;
  return createPortal(
    <div id="print-root" className="text-ink hidden">
      {items.map((item, i) => (
        <Slip key={item.id} run={run} item={item} company={company} last={i === items.length - 1} />
      ))}
    </div>,
    document.body,
  );
}

function Slip({ run, item, company, last }: { run: PayrollRun; item: PayrollItem; company: string; last: boolean }) {
  const t = useTranslations('Payroll.payslip');
  const tf = useTranslations('Footer');
  const tAccounts = useTranslations('Employees.accounts');
  const money = usePayMoney();
  const monthLabel = useMonthLabel();
  const date = useDate();
  const { earn, off } = payslipLines(item);
  const label = (key: string) => (key === 'absence' ? t('lines.absence', { days: item.absenceDays }) : t(`lines.${key}`));

  return (
    <section style={last ? undefined : { breakAfter: 'page' }} className="pb-6">
      <header className="border-ink flex items-center justify-between gap-6 border-b-2 pb-4">
        <div>
          <p className="text-xl font-extrabold">{company}</p>
          <p className="text-muted mt-1 text-sm">{t('title', { month: monthLabel(run.month) })}</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="bg-brand flex size-8 items-center justify-center rounded-[10px] text-white">
            <Scale className="size-4" />
          </span>
          {tf('brandName')}
        </div>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{t('employee')}</dt>
          <dd className="font-bold">{item.name}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{t('number')}</dt>
          <dd className="font-bold" dir="ltr">
            {item.employee.ref}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{t('jobTitle')}</dt>
          <dd className="font-bold">{item.jobTitle ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{t('department')}</dt>
          <dd className="font-bold">{item.employee.department ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{t('paidBy')}</dt>
          <dd className="font-bold">{tAccounts(item.payAccount)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{t('paidOn')}</dt>
          <dd className="font-bold">{run.paidOn ? date(run.paidOn) : t('notPaid')}</dd>
        </div>
      </dl>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-line border-b">
              <th className="py-2 text-start font-extrabold">{t('earnings')}</th>
              <th className="py-2 text-end font-extrabold">{t('amount')}</th>
            </tr>
          </thead>
          <tbody>
            {earn.map(([k, v]) => (
              <tr key={k} className="border-line border-b">
                <td className="py-2">{label(k)}</td>
                <td className="py-2 text-end tabular-nums">{money(v)}</td>
              </tr>
            ))}
            <tr>
              <td className="py-2 font-extrabold">{t('gross')}</td>
              <td className="py-2 text-end font-extrabold tabular-nums">{money(item.gross)}</td>
            </tr>
          </tbody>
        </table>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-line border-b">
              <th className="py-2 text-start font-extrabold">{t('deductions')}</th>
              <th className="py-2 text-end font-extrabold">{t('amount')}</th>
            </tr>
          </thead>
          <tbody>
            {off.length === 0 ? (
              <tr className="border-line border-b">
                <td className="text-muted py-2" colSpan={2}>
                  {t('noDeductions')}
                </td>
              </tr>
            ) : (
              off.map(([k, v]) => (
                <tr key={k} className="border-line border-b">
                  <td className="py-2">{label(k)}</td>
                  <td className="py-2 text-end tabular-nums">{money(v)}</td>
                </tr>
              ))
            )}
            <tr>
              <td className="py-2 font-extrabold">{t('totalDeductions')}</td>
              <td className="py-2 text-end font-extrabold tabular-nums">{money(item.deductions)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-brand-soft mt-6 flex items-center justify-between rounded-xl px-5 py-4">
        <span className="text-brand-deep text-base font-extrabold">{t('net')}</span>
        <span className="text-brand-deep text-2xl font-extrabold tabular-nums">{money(item.net)}</span>
      </div>
      {(item.deductionNote || item.note) && (
        <p className="text-muted mt-3 text-xs">{[item.deductionNote, item.note].filter(Boolean).join(' · ')}</p>
      )}

      <div className="mt-14 grid grid-cols-2 gap-10 text-sm">
        <p className="border-line border-t pt-2 text-center">{t('signEmployee')}</p>
        <p className="border-line border-t pt-2 text-center">{t('signCompany')}</p>
      </div>
    </section>
  );
}
