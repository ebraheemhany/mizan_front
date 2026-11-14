// lib/mock/accounts.ts

// TODO: يتوحّد مع باقي التواريخ الثابتة وقت الربط
export const ACCOUNTS_TODAY = '2026-10-13';
export const ACCOUNTS_MONTH = '2026-10-01';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type AccountKey =
  | 'cash'
  | 'bank'
  | 'customers'
  | 'suppliers'
  | 'vat'
  | 'capital'
  | 'sales'
  | 'payroll';

export type Account = {
  code: string;
  key: AccountKey; // اسم الحساب من الترجمة Accounts.names
  type: AccountType;
  balance: number;
};
export type LineAccount = AccountKey | 'utilities';
// TODO: دليل الحسابات من الـ API
export const ACCOUNTS: Account[] = [
  { code: '1010', key: 'cash', type: 'asset', balance: 24600 },
  { code: '1020', key: 'bank', type: 'asset', balance: 161800 },
  { code: '1100', key: 'customers', type: 'asset', balance: 38900 },
  { code: '2100', key: 'suppliers', type: 'liability', balance: 6200 },
  { code: '2200', key: 'vat', type: 'liability', balance: 8270 },
  { code: '3000', key: 'capital', type: 'equity', balance: 150000 },
  { code: '4000', key: 'sales', type: 'revenue', balance: 108000 },
  { code: '5000', key: 'payroll', type: 'expense', balance: 24000 },
];
export type EntryDesc = {
  key: 'invoicePayment' | 'invoiceIssue' | 'electricity' | 'payroll' | 'manual';
  ref?: string;
  month?: string;
  text?: string; // البيان الحر للقيد اليدوي
};

export type EntrySource = 'invoice' | 'payment' | 'expense' | 'payroll' | 'manual';
export type EntryStatus = 'posted' | 'draft';

export type EntryLine = {
  account: LineAccount;
  debit: number;
  credit: number;
};

export type JournalEntry = {
  id: string;
  number: string;
  date: string; // ISO
  desc: EntryDesc;
  source: EntrySource;
  status: EntryStatus;
  lines: EntryLine[];
};

export const entryTotals = (e: JournalEntry) => ({
  debit: e.lines.reduce((s, l) => s + l.debit, 0),
  credit: e.lines.reduce((s, l) => s + l.credit, 0),
});

const SOURCE_BY_KIND: Record<EntryDesc['key'], EntrySource> = {
  invoicePayment: 'payment',
  invoiceIssue: 'invoice',
  electricity: 'expense',
  payroll: 'payroll',
  manual: 'manual',
};

function build(
  id: string,
  number: string,
  date: string,
  desc: EntryDesc,
  amount: number,
  status: EntryStatus = 'posted',
): JournalEntry {
  let lines: EntryLine[];

  switch (desc.key) {
    case 'invoicePayment':
      lines = [
        { account: 'bank', debit: amount, credit: 0 },
        { account: 'customers', debit: 0, credit: amount },
      ];
      break;
    case 'invoiceIssue': {
      // الإجمالي = المبلغ + ضريبة 14%
      const total = Math.round(amount * 1.14);
      lines = [
        { account: 'customers', debit: total, credit: 0 },
        { account: 'sales', debit: 0, credit: amount },
        { account: 'vat', debit: 0, credit: total - amount },
      ];
      break;
    }
    case 'electricity':
      lines = [
        { account: 'utilities', debit: amount, credit: 0 },
        { account: 'cash', debit: 0, credit: amount },
      ];
      break;
    default:
      lines = [
        { account: 'payroll', debit: amount, credit: 0 },
        { account: 'bank', debit: 0, credit: amount },
      ];
  }

  return { id, number, date, desc, source: SOURCE_BY_KIND[desc.key], status, lines };
}

const KINDS: EntryDesc['key'][] = ['invoicePayment', 'invoiceIssue', 'electricity', 'payroll'];

// توليد ثابت (من غير random) علشان الأرقام ما تتغيرش مع كل refresh
const GENERATED: JournalEntry[] = Array.from({ length: 20 }, (_, i) => {
  const key = KINDS[i % KINDS.length];
  const date = new Date(Date.parse('2026-10-04T00:00:00Z') - i * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const desc: EntryDesc =
    key === 'payroll'
      ? { key, month: '2026-09-01' }
      : key === 'electricity'
        ? { key }
        : { key, ref: String(1041 - (i % 12)) };

  return build(
    `je${408 - i}`,
    `JE-${String(408 - i).padStart(4, '0')}`,
    date,
    desc,
    1000 + ((i * 7919) % 20000),
    i < 3 ? 'draft' : 'posted', // 3 مسودات في أكتوبر
  );
});

// TODO: القيود من الـ API
export const JOURNAL: JournalEntry[] = [
  build('je412', 'JE-0412', '2026-10-12', { key: 'invoicePayment', ref: '1042' }, 12400),
  build('je411', 'JE-0411', '2026-10-11', { key: 'invoiceIssue', ref: '1042' }, 12400),
  build('je410', 'JE-0410', '2026-10-10', { key: 'electricity' }, 1240),
  build('je409', 'JE-0409', '2026-10-05', { key: 'payroll', month: '2026-09-01' }, 24000),
  ...GENERATED,
];

export type TrialKey =
  | 'cashBank'
  | 'customers'
  | 'expenses'
  | 'suppliersTax'
  | 'capital'
  | 'revenue';

export type TrialRow = {
  key: TrialKey;
  debit: number | null;
  credit: number | null;
};

// TODO: الميزان يتحسب من القيود. صف الإيرادات تقدير (اللقطة مقصوصة)
export const TRIAL_BALANCE: TrialRow[] = [
  { key: 'cashBank', debit: 186400, credit: null },
  { key: 'customers', debit: 38900, credit: null },
  { key: 'expenses', debit: 43890, credit: null },
  { key: 'suppliersTax', debit: null, credit: 14470 },
  { key: 'capital', debit: null, credit: 150000 },
  { key: 'revenue', debit: null, credit: 108000 },
];

export type PeriodStatus = 'closed' | 'open' | 'running';

export type FiscalPeriod = {
  id: string;
  kind: 'month' | 'year';
  date: string; // أول يوم في الفترة
  status: PeriodStatus;
  closedAt?: string;
  endsAt?: string;
  unposted?: number; // قيود غير مرحّلة
};

// TODO: الفترات من الـ API
export const PERIODS: FiscalPeriod[] = [
  { id: '2026-09', kind: 'month', date: '2026-09-01', status: 'closed', closedAt: '2026-10-05' },
  { id: '2026-10', kind: 'month', date: '2026-10-01', status: 'open', unposted: 3 },
  { id: '2026-fy', kind: 'year', date: '2026-01-01', status: 'running', endsAt: '2026-12-31' },
];