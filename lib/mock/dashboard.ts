// lib/mock/dashboard.ts
import { INVOICES, type Invoice } from './invoices';

// TODO: الاسم هيجي من المستخدم المسجّل لما نبني الـ auth
export const CURRENT_USER = { firstName: 'محمد' };

// TODO: كل الأرقام دي هتيجي من الـ API
export const DASHBOARD_STATS = {
  revenue: 184500,
  revenueChange: 23,
  expenses: 62300,
  expensesChange: 7,
  netProfit: 122200,
  netProfitChange: 31,
};

export const CHART_MAX = 200000;
export const CHART_TICKS = [0, 50000, 100000, 150000, 200000];

// month: رقم الشهر من 0 (يناير). من مايو لأكتوبر 2026
export const CHART_DATA = [
  { month: 4, revenue: 115000, expenses: 47000 },
  { month: 5, revenue: 129000, expenses: 55000 },
  { month: 6, revenue: 122000, expenses: 51000 },
  { month: 7, revenue: 154000, expenses: 64000 },
  { month: 8, revenue: 145000, expenses: 57000 },
  { month: 9, revenue: 184500, expenses: 62300 },
];

export type AttentionType = 'invoiceOverdue' | 'staleDeal' | 'pendingQuote';

export type AttentionItem = {
  id: string;
  type: AttentionType;
  number?: number;
  customer: string;
  amount: number;
  days: number;
  href: string;
};

export const ATTENTION: AttentionItem[] = [
  { id: 'a1', type: 'invoiceOverdue', number: 1038, customer: 'شركة النيل للتجارة', amount: 8200, days: 12, href: '/invoices/1038' },
  { id: 'a2', type: 'invoiceOverdue', number: 1031, customer: 'مطعم السلام', amount: 6000, days: 20, href: '/invoices/1031' },
  { id: 'a3', type: 'staleDeal', customer: 'مكتب الأمل للاستشارات', amount: 45000, days: 5, href: '/deals' },
  { id: 'a4', type: 'pendingQuote', customer: 'شركة الرواد', amount: 27500, days: 3, href: '/quotes' },
];

// نفس الفواتير اللي في التصميم
export const RECENT_INVOICES: Invoice[] = [1042, 1041, 1040, 1038, 1031]
  .map((n) => INVOICES.find((i) => i.number === n))
  .filter((i): i is Invoice => Boolean(i));