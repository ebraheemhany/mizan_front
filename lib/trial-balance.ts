// lib/trial-balance.ts
import {
  ACCOUNTS,
  type AccountType,
  type JournalEntry,
  type LineAccount,
} from '@/lib/mock/accounts';

// دليل الحسابات اللي ممكن تظهر في أسطر القيود
// TODO: كود المرافق (5100) تقدير، يجي من دليل الحسابات الحقيقي
const LINE_ACCOUNTS: { key: LineAccount; code: string; type: AccountType }[] = [
  ...ACCOUNTS.map((a) => ({ key: a.key, code: a.code, type: a.type })),
  { key: 'utilities', code: '5100', type: 'expense' },
];

export type TrialLine = {
  key: LineAccount;
  code: string;
  type: AccountType;
  debit: number;
  credit: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

// month: 'all' أو 'yyyy-mm'
export function computeTrial(entries: JournalEntry[], month: string) {
  const inPeriod = entries.filter((e) => month === 'all' || e.date.startsWith(month));
  const posted = inPeriod.filter((e) => e.status === 'posted');
  const drafts = inPeriod.length - posted.length;

  const sums = new Map<LineAccount, { d: number; c: number }>();
  for (const e of posted) {
    for (const l of e.lines) {
      const cur = sums.get(l.account) ?? { d: 0, c: 0 };
      cur.d += l.debit;
      cur.c += l.credit;
      sums.set(l.account, cur);
    }
  }

  const rows: TrialLine[] = LINE_ACCOUNTS.flatMap((a) => {
    const s = sums.get(a.key);
    if (!s) return [];
    const net = round2(s.d - s.c);
    if (net === 0) return [];
    return [{ ...a, debit: net > 0 ? net : 0, credit: net < 0 ? -net : 0 }];
  });

  const totalDebit = round2(rows.reduce((s, r) => s + r.debit, 0));
  const totalCredit = round2(rows.reduce((s, r) => s + r.credit, 0));

  return {
    rows,
    drafts,
    totalDebit,
    totalCredit,
    difference: round2(totalDebit - totalCredit),
    balanced: totalDebit === totalCredit,
  };
}