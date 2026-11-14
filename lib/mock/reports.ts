export type ReportPeriod = 'thisQuarter' | 'thisYear' | `${number}-${number}`

// income = إيراد، cost = تكلفة مباشرة (بتدخل في مجمل الربح)، expense = مصروف تشغيلي
export type PnlKind = 'income' | 'cost' | 'expense'

export type PnlLine = {
  key: 'salesRevenue' | 'costOfServices' | 'salaries' | 'rent' | 'marketing'
  kind: PnlKind
  amount: number // موجب دايماً، والإشارة بتتحدد من kind
}

export type MonthlyPoint = {
  month: `${number}-${number}` // YYYY-MM
  revenue: number
  expenses: number
}

export type AgingBucket = {
  key: 'notDue' | 'd1_30' | 'd31_60' | 'd60plus'
  amount: number
}

export type VatSummary = {
  output: number
  input: number
  dueAmount: number
  dueDate: string
}

export type TopCustomer = {
  id: string
  name: string
  invoicesCount: number
  revenue: number
}

export const CURRENT_MONTH = '2026-10'

// قائمة الأرباح والخسائر للشهر الحالي: هي المصدر الوحيد للكروت والرسم
export const pnlLines: PnlLine[] = [
  { key: 'salesRevenue', kind: 'income', amount: 108000 },
  { key: 'costOfServices', kind: 'cost', amount: 21500 },
  { key: 'salaries', kind: 'expense', amount: 24000 },
  { key: 'rent', kind: 'expense', amount: 9740 },
  { key: 'marketing', kind: 'expense', amount: 3950 },
]

// الشهور اللي قبل الحالي (الشهر الحالي بيتحسب من pnlLines)
export const monthlyHistory: MonthlyPoint[] = [
  { month: '2026-05', revenue: 62000, expenses: 48000 },
  { month: '2026-06', revenue: 76000, expenses: 45000 },
  { month: '2026-07', revenue: 70000, expenses: 47000 },
  { month: '2026-08', revenue: 88000, expenses: 52000 },
  { month: '2026-09', revenue: 92000, expenses: 54800 },
]

// رصيد البنك + الخزينة (مش جزء من قائمة الأرباح والخسائر)
export const cashBalance = 186400
// آخر 6 شهور (القيم تقديرية من التصميم)
export const monthlySeries: MonthlyPoint[] = [
  { month: '2026-05', revenue: 62000, expenses: 48000 },
  { month: '2026-06', revenue: 76000, expenses: 45000 },
  { month: '2026-07', revenue: 70000, expenses: 47000 },
  { month: '2026-08', revenue: 88000, expenses: 52000 },
  { month: '2026-09', revenue: 92000, expenses: 60000 },
  { month: '2026-10', revenue: 108000, expenses: 65000 },
]

// export const pnlLines: PnlLine[] = [
//   { key: 'salesRevenue', amount: 108000, kind: 'normal' },
//   { key: 'costOfServices', amount: -21500, kind: 'normal' },
//   { key: 'grossProfit', amount: 86500, kind: 'subtotal' },
//   { key: 'salaries', amount: -24000, kind: 'normal' },
//   { key: 'rent', amount: -9740, kind: 'normal' },
//   { key: 'marketing', amount: -3950, kind: 'normal' },
// ]
export const pnlNetProfit = 48810

// lib/mock/reports.ts
// أعمار الديون بتفصيل كل عميل، والإجماليات بتتحسب منها
// TODO: تيجي من الفواتير المفتوحة لما نربط الـ API
export type AgingRow = {
  id: string
  name: string
} & Record<AgingBucket['key'], number>

export const agingRows: AgingRow[] = [
  { id: 'c1', name: 'شركة النيل للتجارة', notDue: 12000, d1_30: 5200, d31_60: 0, d60plus: 0 },
  { id: 'c2', name: 'أكاديمية المستقبل', notDue: 8700, d1_30: 0, d31_60: 6000, d60plus: 0 },
  { id: 'c3', name: 'عيادة الشفاء', notDue: 4000, d1_30: 3000, d31_60: 0, d60plus: 0 },
]

export const agingBuckets: AgingBucket[] = (
  ['notDue', 'd1_30', 'd31_60', 'd60plus'] as const
).map((key) => ({
  key,
  amount: agingRows.reduce((sum, row) => sum + row[key], 0),
}))

// نسبة ضريبة القيمة المضافة
export const VAT_RATE = 0.14

export const vatSummary: VatSummary = {
  output: 15120,
  input: 6850,
  dueAmount: 8270,
  dueDate: '2026-11-15',
}

export const topCustomers: TopCustomer[] = [
  { id: 'c1', name: 'شركة النيل للتجارة', invoicesCount: 9, revenue: 41300 },
  { id: 'c2', name: 'أكاديمية المستقبل', invoicesCount: 5, revenue: 22000 },
  { id: 'c3', name: 'عيادة الشفاء', invoicesCount: 4, revenue: 15000 },
]


export const balanceSheetInputs = {
  fixedAssets: 60000, // أصول ثابتة
  accountsPayable: 12500, // موردون (دائنون)
  capital: 100000, // رأس المال
}


export const cashFlowInputs = {
  receivablesIncrease: 6200, // زيادة العملاء المدينين (بتقلل النقدية)
  payablesIncrease: 2300, // زيادة الموردين والضريبة (بتزود النقدية)
  equipmentPurchase: 15000, // شراء معدات وأصول
  ownerWithdrawals: 10000, // مسحوبات الشركاء
}


// lib/mock/reports.ts  (ضيف في الآخر)
// حركة حساب العميل: فاتورة = مدين، دفعة = دائن
// TODO: تيجي من الفواتير والدفعات لما نربط الـ API
export type StatementTxn = {
  id: string
  date: string // YYYY-MM-DD
  type: 'invoice' | 'payment'
  ref: string
  amount: number
}

export type CustomerStatement = {
  id: string // نفس ids في agingRows
  name: string
  openingBalance: number
  txns: StatementTxn[]
}

export const customerStatements: CustomerStatement[] = [
  {
    id: 'c1',
    name: 'شركة النيل للتجارة',
    openingBalance: 4000,
    txns: [
      { id: 't1', date: '2026-10-03', type: 'invoice', ref: 'INV-1041', amount: 12000 },
      { id: 't2', date: '2026-10-08', type: 'payment', ref: 'PAY-2207', amount: 4000 },
      { id: 't3', date: '2026-10-15', type: 'invoice', ref: 'INV-1048', amount: 5200 },
    ],
  },
  {
    id: 'c2',
    name: 'أكاديمية المستقبل',
    openingBalance: 9000,
    txns: [
      { id: 't4', date: '2026-10-05', type: 'invoice', ref: 'INV-1043', amount: 8700 },
      { id: 't5', date: '2026-10-18', type: 'payment', ref: 'PAY-2211', amount: 3000 },
    ],
  },
  {
    id: 'c3',
    name: 'عيادة الشفاء',
    openingBalance: 3000,
    txns: [
      { id: 't6', date: '2026-10-10', type: 'invoice', ref: 'INV-1046', amount: 4000 },
      { id: 't7', date: '2026-10-12', type: 'payment', ref: 'PAY-2209', amount: 3000 },
      { id: 't8', date: '2026-10-20', type: 'invoice', ref: 'INV-1052', amount: 3000 },
    ],
  },
]


