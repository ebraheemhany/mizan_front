// lib/accounting.ts
import type { InvoiceDetail, Payment } from '@/lib/mock/invoice-details';

export type AccountKey = 'cash' | 'bank' | 'card' | 'wallet' | 'receivable' | 'vat' | 'revenue' | 'rounding';

// TODO: الأكواد دي وهمية، هتيجي من دليل الحسابات لما نبني صفحة الحسابات والقيود
export const ACCOUNT_CODES: Record<AccountKey, string> = {
  cash: '1101',
  bank: '1102',
  card: '1103',
  wallet: '1104',
  receivable: '1201',
  vat: '2101',
  revenue: '4101',
  rounding: '5901',
};

export type JournalLine = { account: AccountKey; debit: number; credit: number };

export type JournalEntry = {
  id: string;
  kind: 'invoice' | 'payment';
  date: string; // yyyy-mm-dd
  reference: string;
  lines: JournalLine[];
};

/** The account a payment is debited to: the receiving account if one was chosen, else by method. */
export function paymentAccount(p: Pick<Payment, 'method' | 'account'>): AccountKey {
  switch (p.account) {
    case 'cashbox':
      return 'cash';
    case 'wallet':
      return 'wallet';
    case 'bank':
      return 'bank';
  }
  switch (p.method) {
    case 'cash':
      return 'cash';
    case 'card':
      return 'card';
    case 'vodafoneCash':
      return 'wallet';
    default:
      // bank transfer, InstaPay and cheques all land in the bank.
      return 'bank';
  }
}

export function buildJournalEntries(invoice: InvoiceDetail): JournalEntry[] {
  // المسودات والملغاة مفيهاش ترحيل
  if (invoice.status === 'draft' || invoice.status === 'cancelled') return [];

  const issueLines: JournalLine[] = [
    { account: 'receivable', debit: invoice.total, credit: 0 },
    { account: 'revenue', debit: 0, credit: invoice.subtotal },
    { account: 'vat', debit: 0, credit: invoice.vat },
  ];

  // فرق التقريب بيروح مدين لو الإجمالي أقل من المجموع، ودائن لو أكتر
  if (invoice.rounding < 0) {
    issueLines.splice(1, 0, { account: 'rounding', debit: -invoice.rounding, credit: 0 });
  } else if (invoice.rounding > 0) {
    issueLines.push({ account: 'rounding', debit: 0, credit: invoice.rounding });
  }

  const entries: JournalEntry[] = [
    {
      id: 'je-issue',
      kind: 'invoice',
      date: invoice.issueDate,
      reference: `JE-${invoice.number}-1`,
      lines: issueLines,
    },
  ];

  [...invoice.payments]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((p, i) => {
      entries.push({
        id: `je-${p.id}`,
        kind: 'payment',
        date: p.date,
        reference: `JE-${invoice.number}-${i + 2}`,
        lines: [
          { account: paymentAccount(p), debit: p.amount, credit: 0 },
          { account: 'receivable', debit: 0, credit: p.amount },
        ],
      });
    });

  return entries;
}
