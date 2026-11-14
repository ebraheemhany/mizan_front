// lib/mock/expenses.ts
// بيانات وهمية لصفحة المصروفات
// TODO: تتربط بالـ API لما الباك إند يجهز

export type ExpenseCategory =
  | 'salaries'
  | 'rent'
  | 'purchases'
  | 'marketing'
  | 'utilities'
  | 'software'

// TODO: تتربط بصفحة الحسابات لما نبنيها (البنك الأهلي مجرد مثال)
export type ExpenseSource = 'bank' | 'cash' | 'card'

export type ExpenseStatus = 'paid' | 'due'

export type Expense = {
  id: string
  date: string // YYYY-MM-DD
  title: string
  category: ExpenseCategory
  amount: number
  status: ExpenseStatus
  paidFrom?: ExpenseSource // بيتحدد لما المصروف يتدفع
  dueDate?: string // للمستحق بس
  vendor?: string
}

export const mockExpenses: Expense[] = [
  // أكتوبر 2026
  { id: 'e1', date: '2026-10-12', title: 'إيجار المكتب', category: 'rent', amount: 8500, status: 'paid', paidFrom: 'bank' },
  { id: 'e2', date: '2026-10-10', title: 'فاتورة كهرباء', category: 'utilities', amount: 1240, status: 'paid', paidFrom: 'cash' },
  { id: 'e3', date: '2026-10-08', title: 'إعلانات فيسبوك', category: 'marketing', amount: 3000, status: 'paid', paidFrom: 'card' },
  { id: 'e4', date: '2026-10-05', title: 'رواتب سبتمبر', category: 'salaries', amount: 24000, status: 'paid', paidFrom: 'bank' },
  { id: 'e5', date: '2026-10-03', title: 'اشتراك برامج', category: 'software', amount: 950, status: 'paid', paidFrom: 'card' },
  { id: 'e6', date: '2026-10-01', title: 'مورد الأجهزة — دفعة', category: 'purchases', amount: 6200, status: 'due', dueDate: '2026-10-20', vendor: 'مورد الأجهزة' },

  // سبتمبر 2026 (علشان مقارنة "عن سبتمبر")
  { id: 'e7', date: '2026-09-05', title: 'رواتب أغسطس', category: 'salaries', amount: 24000, status: 'paid', paidFrom: 'bank' },
  { id: 'e8', date: '2026-09-03', title: 'إيجار المكتب', category: 'rent', amount: 8500, status: 'paid', paidFrom: 'bank' },
  { id: 'e9', date: '2026-09-12', title: 'فاتورة كهرباء', category: 'utilities', amount: 1100, status: 'paid', paidFrom: 'cash' },
  { id: 'e10', date: '2026-09-18', title: 'إعلانات فيسبوك', category: 'marketing', amount: 2800, status: 'paid', paidFrom: 'card' },
  { id: 'e11', date: '2026-09-22', title: 'مورد الأجهزة — دفعة', category: 'purchases', amount: 5000, status: 'paid', paidFrom: 'bank', vendor: 'مورد الأجهزة' },

    // شهور أقدم (علشان نجرّب فلتر الفترة والترقيم)
  { id: 'e12', date: '2026-08-05', title: 'رواتب يوليو', category: 'salaries', amount: 22000, status: 'paid', paidFrom: 'bank' },
  { id: 'e13', date: '2026-08-03', title: 'إيجار المكتب', category: 'rent', amount: 8500, status: 'paid', paidFrom: 'bank' },
  { id: 'e14', date: '2026-08-14', title: 'اشتراك برامج', category: 'software', amount: 950, status: 'paid', paidFrom: 'card' },
  { id: 'e15', date: '2026-07-20', title: 'مشتريات مكتبية', category: 'purchases', amount: 3200, status: 'paid', paidFrom: 'cash' },
]

// إيرادات الشهر الحالي، مأخوذة من اللقطة (43,410 + 43,890)
// TODO: تيجي من الفواتير/التقارير لما نربط الـ API
export const monthRevenue = 87300

export const EXPENSES_TODAY = '2026-10-25'

