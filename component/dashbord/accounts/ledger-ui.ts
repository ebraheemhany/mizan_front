// component/dashbord/accounts/ledger-ui.ts
// Shared bits of the accounts page: account names, entry descriptions, styles.
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { saveFile } from '@/lib/files';
import type { AccountRef, EntrySource, JournalEntry, SourceFilter } from '@/lib/ledger/hooks';

export const card = 'rounded-card border-line bg-surface border shadow-sm';
export const cardTitle = 'text-ink px-5 pt-5 pb-3 text-base font-extrabold';
export const th = 'bg-canvas text-muted px-4 py-3 text-start text-xs font-bold whitespace-nowrap';
export const td = 'px-4 py-3.5 text-xs';
export const outlineBtn =
  'border-line-strong bg-surface text-ink hover:bg-neutral-soft rounded-btn flex h-10 items-center gap-2 border px-4 text-xs font-bold transition-colors disabled:opacity-50';

/** Built-in accounts are named by the app (Accounts.names.<key>); added ones by the company. */
export function useAccountName() {
  const t = useTranslations('Accounts.names');
  return (a: Pick<AccountRef, 'key' | 'name' | 'code'>) =>
    a.key ? (t.has(a.key) ? t(a.key) : a.key) : (a.name ?? a.code);
}

/** The filter group an entry belongs to (cheques clearing are payments; paying a due expense is an expense). */
export const sourceGroup = (s: EntrySource): Exclude<SourceFilter, 'all'> =>
  s === 'chequeCleared' || s === 'chequeBounced'
    ? 'payment'
    : s === 'expensePayment'
      ? 'expense'
      : s === 'payrollPayment' || s === 'advance'
        ? 'payroll'
        : s;

/** The line the journal shows for an entry, from what it came from. */
export function useEntryText() {
  const t = useTranslations('Accounts.entries');
  const monthLabel = useMonthLabel();
  return (e: Pick<JournalEntry, 'source' | 'ref' | 'memo' | 'party' | 'invoice' | 'month'>) => {
    const values = {
      ref: e.ref ?? '',
      memo: e.memo ?? '',
      party: e.party ?? '',
      invoice: e.invoice?.displayNumber ?? '',
      month: e.month ? monthLabel(e.month) : '',
    };
    if (e.source === 'expense' && e.party) return t('expenseVendor', values);
    return t(e.source, values);
  };
}

/** Numbers as in the rest of the books: Latin digits, up to 2 decimals. */
export function useNum() {
  const format = useFormatter();
  return (n: number) => format.number(n, { numberingSystem: 'latn', maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

/** "2026-10" -> "أكتوبر 2026". */
export function useMonthLabel() {
  const format = useFormatter();
  return (month: string, withYear = true) =>
    format.dateTime(new Date(`${month}-01T00:00:00Z`), {
      month: 'long',
      ...(withYear ? { year: 'numeric' as const } : {}),
      numberingSystem: 'latn',
      timeZone: 'UTC',
    });
}

/** "2026-10-13" -> "13 أكتوبر" (or with the year). */
export function useDay() {
  const format = useFormatter();
  return (iso: string, withYear = false) =>
    format.dateTime(new Date(`${iso.slice(0, 10)}T00:00:00Z`), {
      day: 'numeric',
      month: 'long',
      ...(withYear ? { year: 'numeric' as const } : {}),
      numberingSystem: 'latn',
      timeZone: 'UTC',
    });
}

/** Downloads rows as a CSV file Excel opens in Arabic (BOM + quoted cells). */
export function downloadCsv(filename: string, header: string[], rows: string[][]) {
  const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\n');
  void saveFile(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
}
