// lib/mock/recurring.ts
export type Frequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type RecurringStatus = 'active' | 'paused' | 'ended';
import { CUSTOMERS } from './customers';
import { MOCK_NOW } from './invoices';
import type { RecurringFormValues } from '@/lib/validations/recurring';
export type RecurringInvoice = {
  id: string;
  name: string;
  customer: string;
  frequency: Frequency;
  amount: number; // الإجمالي شامل الضريبة
  nextDate: string | null; // yyyy-mm-dd
  generatedCount: number;
  autoSend: boolean;
  status: RecurringStatus;
};

// بيحوّل قيمة كل قالب لمقابلها الشهري، علشان نحسب الإيراد الشهري المتكرر
export const MONTHLY_FACTOR: Record<Frequency, number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

// TODO: البيانات دي هتيجي من الـ API
export const RECURRING: RecurringInvoice[] = [
  { id: 'r1', name: 'دعم فني شهري', customer: 'شركة النيل للتجارة', frequency: 'monthly', amount: 6840, nextDate: '2026-11-01', generatedCount: 14, autoSend: true, status: 'active' },
  { id: 'r2', name: 'استضافة وصيانة الموقع', customer: 'مكتب الأمل للاستشارات', frequency: 'quarterly', amount: 13680, nextDate: '2026-12-01', generatedCount: 6, autoSend: true, status: 'active' },
  { id: 'r3', name: 'اشتراك الباقة السنوية', customer: 'شركة الرواد', frequency: 'yearly', amount: 45600, nextDate: '2027-02-15', generatedCount: 2, autoSend: false, status: 'active' },
  { id: 'r4', name: 'إيجار المعدات', customer: 'مطعم السلام', frequency: 'monthly', amount: 3420, nextDate: '2026-10-18', generatedCount: 9, autoSend: true, status: 'active' },
  { id: 'r5', name: 'زيارة صيانة أسبوعية', customer: 'مخبز الصباح', frequency: 'weekly', amount: 1140, nextDate: '2026-10-15', generatedCount: 31, autoSend: false, status: 'active' },
  { id: 'r6', name: 'تقارير محاسبية شهرية', customer: 'عيادة الشفاء', frequency: 'monthly', amount: 2280, nextDate: '2026-11-05', generatedCount: 5, autoSend: true, status: 'paused' },
  { id: 'r7', name: 'عقد تسويق', customer: 'متجر الأناقة', frequency: 'monthly', amount: 9120, nextDate: '2026-11-10', generatedCount: 7, autoSend: true, status: 'paused' },
  { id: 'r8', name: 'دورة تدريبية', customer: 'أكاديمية المستقبل', frequency: 'quarterly', amount: 17100, nextDate: null, generatedCount: 4, autoSend: false, status: 'ended' },
];

// TODO: لما نربط الـ API، التعديل بيجيب القالب كامل (البنود والعميل وشرط الانتهاء) من الباك إند
export function getRecurringFormValues(id: string): RecurringFormValues | undefined {
  const r = RECURRING.find((x) => x.id === id);
  if (!r) return undefined;

  return {
    name: r.name,
    customerId: CUSTOMERS.find((c) => c.name === r.customer)?.id ?? '',
    frequency: r.frequency,
    startDate: r.nextDate ?? MOCK_NOW.toISOString().slice(0, 10),
    endMode: 'never',
    endDate: '',
    occurrences: '12',
    terms: 30,
    autoSend: r.autoSend,
    // بند واحد بيتحسب من القيمة بعد ما نشيل الضريبة 14%
    items: [{ description: r.name, quantity: '1', unitPrice: String(Math.round(r.amount / 1.14)) }],
    notes: '',
  };
}







