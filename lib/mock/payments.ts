// lib/mock/payments.ts
// بيانات وهمية لصفحة الدفعات
// TODO: تتربط بالـ API لما الباك إند يجهز
import type { ReceivingAccount } from '@/lib/payments/constants'

export type PaymentMethod =
  | 'bankTransfer'
  | 'cash'
  | 'instapay'
  | 'vodafoneCash'
  | 'cheque'

// cleared = اتحصّلت، pending = شيك لسه قيد الصرف
export type PaymentStatus = 'cleared' | 'pending'

export type Payment = {
  id: string
  number: string // PAY-0212
  invoiceNo: number
  customer: string
  date: string // YYYY-MM-DD
  invoiceDate: string // تاريخ إصدار الفاتورة (لحساب أيام التحصيل)
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  account?: ReceivingAccount
  reference?: string
  note?: string
}

// فاتورة مفتوحة (لسه عليها رصيد)
export type OpenInvoice = {
  number: number
  customer: string
  balance: number
  issued: string
  due: string
}

// تاريخ "النهارده" زي لقطة الدفعات
// TODO: نوحّده مع باقي الصفحات لما نربط كل حاجة
export const PAYMENTS_TODAY = '2026-10-13'

export const mockPayments: Payment[] = [
  // أكتوبر 2026
  { id: 'p212', number: 'PAY-0212', invoiceNo: 1042, customer: 'شركة النيل للتجارة', date: '2026-10-11', invoiceDate: '2026-09-24', method: 'bankTransfer', amount: 12400, status: 'cleared' },
  { id: 'p211', number: 'PAY-0211', invoiceNo: 1039, customer: 'مصر الصباح', date: '2026-10-08', invoiceDate: '2026-09-21', method: 'cash', amount: 9600, status: 'cleared' },
  { id: 'p210', number: 'PAY-0210', invoiceNo: 1036, customer: 'أكاديمية المستقبل', date: '2026-10-05', invoiceDate: '2026-09-15', method: 'instapay', amount: 10000, status: 'cleared' },
  { id: 'p209', number: 'PAY-0209', invoiceNo: 1037, customer: 'عيادة الشفاء', date: '2026-10-02', invoiceDate: '2026-09-17', method: 'vodafoneCash', amount: 15000, status: 'cleared' },

  // سبتمبر 2026
  { id: 'p208', number: 'PAY-0208', invoiceNo: 1035, customer: 'متجر الأناقة', date: '2026-09-29', invoiceDate: '2026-09-10', method: 'cheque', amount: 11200, status: 'pending' },
  { id: 'p207', number: 'PAY-0207', invoiceNo: 1030, customer: 'بقالة الحي', date: '2026-09-24', invoiceDate: '2026-09-03', method: 'cash', amount: 3800, status: 'cleared' },
  { id: 'p206', number: 'PAY-0206', invoiceNo: 1029, customer: 'شركة النيل للتجارة', date: '2026-09-20', invoiceDate: '2026-08-30', method: 'bankTransfer', amount: 14000, status: 'cleared' },
  { id: 'p205', number: 'PAY-0205', invoiceNo: 1028, customer: 'مصر الصباح', date: '2026-09-15', invoiceDate: '2026-08-25', method: 'instapay', amount: 12000, status: 'cleared' },
  { id: 'p204', number: 'PAY-0204', invoiceNo: 1027, customer: 'أكاديمية المستقبل', date: '2026-09-09', invoiceDate: '2026-08-19', method: 'bankTransfer', amount: 10000, status: 'cleared' },

  // شهور أقدم (علشان نجرّب الترقيم والفلاتر)
  { id: 'p203', number: 'PAY-0203', invoiceNo: 1026, customer: 'عيادة الشفاء', date: '2026-08-28', invoiceDate: '2026-08-08', method: 'cash', amount: 8500, status: 'cleared' },
  { id: 'p202', number: 'PAY-0202', invoiceNo: 1025, customer: 'بقالة الحي', date: '2026-08-21', invoiceDate: '2026-08-01', method: 'vodafoneCash', amount: 6200, status: 'cleared' },
  { id: 'p201', number: 'PAY-0201', invoiceNo: 1024, customer: 'متجر الأناقة', date: '2026-08-14', invoiceDate: '2026-07-25', method: 'bankTransfer', amount: 9000, status: 'cleared' },
  { id: 'p200', number: 'PAY-0200', invoiceNo: 1023, customer: 'شركة النيل للتجارة', date: '2026-08-07', invoiceDate: '2026-07-18', method: 'instapay', amount: 7400, status: 'cleared' },
  { id: 'p199', number: 'PAY-0199', invoiceNo: 1022, customer: 'مصر الصباح', date: '2026-07-30', invoiceDate: '2026-07-10', method: 'cash', amount: 5600, status: 'cleared' },
  { id: 'p198', number: 'PAY-0198', invoiceNo: 1021, customer: 'أكاديمية المستقبل', date: '2026-07-22', invoiceDate: '2026-07-02', method: 'bankTransfer', amount: 11000, status: 'cleared' },
  { id: 'p197', number: 'PAY-0197', invoiceNo: 1020, customer: 'عيادة الشفاء', date: '2026-07-15', invoiceDate: '2026-06-26', method: 'cheque', amount: 4800, status: 'cleared' },
]

// الفواتير المفتوحة: 9 فواتير مجموعها 38,900
export const openInvoices: OpenInvoice[] = [
  { number: 1038, customer: 'شركة النيل للتجارة', balance: 8200, issued: '2026-09-17', due: '2026-10-01' },
  { number: 1041, customer: 'شركة النيل للتجارة', balance: 5000, issued: '2026-10-05', due: '2026-10-20' },
  { number: 1043, customer: 'شركة النيل للتجارة', balance: 4000, issued: '2026-10-08', due: '2026-10-28' },
  { number: 1044, customer: 'أكاديمية المستقبل', balance: 6000, issued: '2026-09-13', due: '2026-09-28' },
  { number: 1045, customer: 'أكاديمية المستقبل', balance: 5200, issued: '2026-10-03', due: '2026-10-18' },
  { number: 1046, customer: 'أكاديمية المستقبل', balance: 3500, issued: '2026-10-10', due: '2026-10-30' },
  { number: 1047, customer: 'عيادة الشفاء', balance: 3000, issued: '2026-09-25', due: '2026-10-10' },
  { number: 1048, customer: 'عيادة الشفاء', balance: 2500, issued: '2026-10-06', due: '2026-10-25' },
  { number: 1049, customer: 'عيادة الشفاء', balance: 1500, issued: '2026-10-12', due: '2026-11-05' },
]


// أرقام وهمية بصيغة دولية (بدون +)
// TODO: تيجي من بيانات العميل لما نربط الـ API
export const customerPhones: Record<string, string> = {
  'شركة النيل للتجارة': '201000000001',
  'أكاديمية المستقبل': '201000000002',
  'عيادة الشفاء': '201000000003',
}

