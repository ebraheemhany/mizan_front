// lib/mock/invoices.ts
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export type Invoice = {
  id: string;
  number: number;
  customer: string;
  issueDate: string; // yyyy-mm-dd
  dueDate: string;
  total: number;
  remaining: number;
  status: InvoiceStatus;
  daysOverdue?: number;
  /** The number as the company shows it (prefix + number, e.g. INV-2). */
  displayNumber?: string;
};

// "النهارده" في البيانات الوهمية. بيتشال لما نربط الـ API
export const MOCK_NOW = new Date('2026-10-13T00:00:00Z');

// TODO: الأرقام دي هتيجي من الـ API
export const INVOICE_STATS = {
  outstanding: 38900,
  unpaidCount: 9,
  overdue: 14200,
  overdueCount: 2,
  collectedThisMonth: 87300,
  collectedChangePct: 18,
  draftsCount: 3,
  draftsValue: 43802,
};

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function inv(
  number: number,
  customer: string,
  issueDate: string,
  total: number,
  remaining: number,
  status: InvoiceStatus,
  daysOverdue?: number,
): Invoice {
  return {
    id: `i${number}`,
    number,
    customer,
    issueDate,
    dueDate: addDays(issueDate, 30),
    total,
    remaining,
    status,
    daysOverdue,
  };
}

const NAMES = [
  'شركة النيل للتجارة',
  'مكتب الأمل للاستشارات',
  'شركة الرواد',
  'مطعم السلام',
  'عيادة الشفاء',
  'مخبز الصباح',
  'متجر الأناقة',
  'أكاديمية المستقبل',
  'بقالة الحي',
];

// أول 11 فاتورة زي التصميم بالظبط
const VISIBLE: Invoice[] = [
  inv(1043, 'شركة النيل للتجارة', '2026-10-13', 16302, 16302, 'draft'),
  inv(1042, 'شركة النيل للتجارة', '2026-10-11', 12400, 0, 'paid'),
  inv(1041, 'مكتب الأمل للاستشارات', '2026-10-09', 18000, 18000, 'sent'),
  inv(1040, 'شركة الرواد', '2026-10-06', 27500, 27500, 'draft'),
  inv(1039, 'مخبز الصباح', '2026-10-04', 9600, 0, 'paid'),
  inv(1038, 'شركة النيل للتجارة', '2026-09-01', 8200, 8200, 'overdue', 12),
  inv(1037, 'عيادة الشفاء', '2026-09-28', 15000, 0, 'paid'),
  inv(1036, 'أكاديمية المستقبل', '2026-09-22', 22000, 12000, 'partial'),
  inv(1035, 'متجر الأناقة', '2026-09-18', 11200, 0, 'paid'),
  inv(1031, 'مطعم السلام', '2026-08-24', 6000, 6000, 'overdue', 20),
  inv(1030, 'بقالة الحي', '2026-08-20', 3800, 0, 'paid'),
];

// الـ 37 الباقيين بتوزيع يطلّع عدد كل حالة زي التابات في التصميم
const POOL: InvoiceStatus[] = [
  ...Array<InvoiceStatus>(26).fill('paid'),
  ...Array<InvoiceStatus>(8).fill('sent'),
  'partial',
  'draft',
  'cancelled',
];

const REST: Invoice[] = Array.from({ length: 37 }, (_, i) => {
  const status = POOL[(i * 11) % 37];
  const total = (((i * 7) % 25) + 4) * 1100;
  const remaining =
    status === 'draft' || status === 'sent' ? total : status === 'partial' ? Math.round(total / 2) : 0;

  return inv(1029 - i, NAMES[i % NAMES.length], addDays('2026-09-16', -i * 3), total, remaining, status);
});

export const INVOICES: Invoice[] = [...VISIBLE, ...REST];

export const INVOICE_CUSTOMERS = [...new Set(INVOICES.map((i) => i.customer))];