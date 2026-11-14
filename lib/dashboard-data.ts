export const DASHBOARD_STATS = [
  { key: 'revenue', value: 184500 },
  { key: 'expenses', value: 62300 },
  { key: 'netProfit', value: 122200 },
  { key: 'receivable', value: 38900 },
] as const;

export const DASHBOARD_REVENUE = [78, 62, 67, 52, 56, 46];
export const DASHBOARD_EXPENSES = [33, 31, 35, 28, 30, 25];

export const DASHBOARD_ALERTS = [
  { key: 'overdueInvoice', days: 12, tone: 'danger' },
  { key: 'staleDeal', days: 5, tone: 'warning' },
  { key: 'pendingQuote', days: 3, tone: 'warning' },
] as const;
