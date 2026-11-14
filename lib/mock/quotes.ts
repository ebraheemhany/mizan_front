// lib/mock/quotes.ts
import { addDaysIso } from '@/lib/iso-date';
import { daysUntil } from '@/lib/relative-time';
import { MOCK_NOW } from './invoices';

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type DisplayStatus = QuoteStatus | 'expiringSoon';

export type Quote = {
  id: string;
  number: number;
  customer: string;
  issueDate: string; // yyyy-mm-dd
  validUntil: string;
  total: number;
  status: QuoteStatus;
  sentDate?: string;
  acceptedDate?: string;
  rejectedDate?: string;
  shareToken?: string;
  items?: { description: string; quantity: number; unitPrice: number }[];
  notes?: string;
};

// TODO: التاريخ الحقيقي لما نربط الـ API
export const TODAY = MOCK_NOW.toISOString().slice(0, 10);

export const VALIDITY_DAYS = 14;
export const EXPIRING_DAYS = 7;
export const RATE_WINDOW_DAYS = 90;

export const quoteLabel = (number: number) => `Q-${number}`;

// العرض المرسل اللي عدّى تاريخ صلاحيته بيتحسب منتهي حتى لو لسه متسجّل "مرسل"
export function effectiveStatus(q: Quote): QuoteStatus {
  if (q.status === 'sent' && q.validUntil < TODAY) return 'expired';
  return q.status;
}

// الحالة اللي بتظهر للمستخدم: المرسل اللي هينتهي خلال أسبوع بيظهر "تنتهي قريباً"
export function displayStatus(q: Quote): DisplayStatus {
  const status = effectiveStatus(q);
  if (status === 'sent' && daysUntil(q.validUntil, MOCK_NOW) <= EXPIRING_DAYS) {
    return 'expiringSoon';
  }
  return status;
}

function quote(
  number: number,
  customer: string,
  issueDate: string,
  total: number,
  status: QuoteStatus,
  opts: { validDays?: number; acceptedDate?: string } = {},
): Quote {
  return {
    id: `q${number}`,
    number,
    customer,
    issueDate,
    validUntil: addDaysIso(issueDate, opts.validDays ?? VALIDITY_DAYS),
    total,
    status,
    acceptedDate: opts.acceptedDate,
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

// أول 7 عروض زي التصميم بالظبط
const VISIBLE: Quote[] = [
  quote(212, 'مكتب الأمل للاستشارات', '2026-10-10', 32500, 'sent'),
  quote(211, 'شركة الرواد', '2026-10-07', 48000, 'accepted', { acceptedDate: '2026-10-09' }),
  quote(210, 'أكاديمية المستقبل', '2026-10-02', 19800, 'sent'),
  quote(209, 'عيادة الشفاء', '2026-09-28', 14250, 'expired'),
  quote(208, 'متجر الأناقة', '2026-09-25', 7400, 'accepted', { acceptedDate: '2026-10-06' }),
  quote(207, 'مطعم السلام', '2026-09-20', 11000, 'draft'),
  quote(206, 'بقالة الحي', '2026-09-15', 5600, 'rejected'),
];

// الـ 20 الباقيين. أول 12 داخل آخر 90 يوم، والباقي أقدم منها
const OLDER: QuoteStatus[] = [
  'sent', 'accepted', 'accepted', 'rejected', 'accepted', 'draft',
  'accepted', 'expired', 'accepted', 'rejected', 'draft', 'accepted',
  'accepted', 'accepted', 'rejected', 'accepted', 'accepted', 'draft',
  'accepted', 'accepted',
];

const GENERATED: Quote[] = OLDER.map((status, i) => {
  const issueDate = addDaysIso('2026-09-10', -5 * i);
  const total = (((i * 7) % 23) + 3) * 1250;

  return quote(205 - i, NAMES[i % NAMES.length], issueDate, total, status, {
    // العرض المرسل الوحيد هنا صلاحيته أطول، علشان يفضل ساري لحد النهارده
    validDays: status === 'sent' ? 60 : VALIDITY_DAYS,
    acceptedDate: status === 'accepted' ? addDaysIso(issueDate, 5) : undefined,
  });
});

// TODO: العروض دي هتيجي من الـ API
export const QUOTES: Quote[] = [...VISIBLE, ...GENERATED];