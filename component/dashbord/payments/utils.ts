// component/dashbord/payments/utils.ts
import { shiftMonth } from '../expenses/utils';
import type { PaymentMethod } from '@/lib/mock/payments';
import type { OpenInvoice, Payment } from '@/lib/mock/payments';

const DAY = 86_400_000;

export function daysBetween(from: string, to: string) {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY,
  );
}

const sum = (list: { amount: number }[]) =>
  list.reduce((s, p) => s + p.amount, 0);

// متوسط أيام التحصيل للدفعات المحصّلة في الشهر (null لو مفيش دفعات)
function averageDays(list: Payment[]) {
  if (list.length === 0) return null;
  const total = list.reduce(
    (s, p) => s + daysBetween(p.invoiceDate, p.date),
    0,
  );
  return Math.round(total / list.length);
}

export function computePaymentStats({
  payments,
  openInvoices,
  month,
  prevMonth,
}: {
  payments: Payment[];
  openInvoices: OpenInvoice[];
  month: string;
  prevMonth: string;
}) {
  // الشيكات اللي لسه قيد الصرف مش محسوبة كتحصيل
  const cleared = payments.filter((p) => p.status === 'cleared');
  const thisMonth = cleared.filter((p) => p.date.startsWith(month));
  const lastMonth = cleared.filter((p) => p.date.startsWith(prevMonth));

  const cheques = payments.filter(
    (p) => p.method === 'cheque' && p.status === 'pending',
  );

  return {
    collected: sum(thisMonth),
    prevCollected: sum(lastMonth),
    openAmount: openInvoices.reduce((s, i) => s + i.balance, 0),
    openCount: openInvoices.length,
    chequeAmount: sum(cheques),
    chequeCount: cheques.length,
    avgDays: averageDays(thisMonth),
    prevAvgDays: averageDays(lastMonth),
  };
}


// component/dashbord/payments/utils.ts  (ضيف في الآخر)
export const PAGE_SIZE = 6;

export type PeriodFilter = 'thisMonth' | 'lastMonth' | 'thisYear' | 'all';
export type MethodFilter = PaymentMethod | 'all';

export type Filters = {
  query: string;
  method: MethodFilter;
  period: PeriodFilter;
};

export const DEFAULT_FILTERS: Filters = {
  query: '',
  method: 'all',
  period: 'all',
};

export function applyFilters(
  payments: Payment[],
  filters: Filters,
  month: string,
) {
  const q = filters.query.trim().toLowerCase();

  return payments
    .filter((p) => {
      if (filters.method !== 'all' && p.method !== filters.method) {
        return false;
      }

      if (filters.period === 'thisMonth' && !p.date.startsWith(month)) {
        return false;
      }
      if (
        filters.period === 'lastMonth' &&
        !p.date.startsWith(shiftMonth(month, -1))
      ) {
        return false;
      }
      if (filters.period === 'thisYear' && !p.date.startsWith(month.slice(0, 4))) {
        return false;
      }

      if (q) {
        const haystack =
          `${p.number} ${p.invoiceNo} ${p.customer}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

// component/dashbord/payments/utils.ts  (ضيف في الآخر)
// الفواتير المتأخرة، الأكثر تأخيراً الأول
export function overdueInvoices(invoices: OpenInvoice[], today: string) {
  return invoices
    .map((invoice) => ({
      invoice,
      daysLate: daysBetween(invoice.due, today),
    }))
    .filter((x) => x.daysLate > 0)
    .sort((a, b) => b.daysLate - a.daysLate);
}
