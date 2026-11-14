// lib/mock/billing.ts

export type BillingStatus = 'paid' | 'pending' | 'failed';

export type BillingInvoice = {
  id: string;
  number: string;
  date: string; // ISO
  amount: number;
  plan: 'pro';
  status: BillingStatus;
};

// TODO: فواتير الاشتراك من الـ API
export const BILLING_INVOICES: BillingInvoice[] = [
  { id: 'b6', number: 'SUB-2026-010', date: '2026-10-01', amount: 1200, plan: 'pro', status: 'paid' },
  { id: 'b5', number: 'SUB-2026-009', date: '2026-09-01', amount: 1200, plan: 'pro', status: 'paid' },
  { id: 'b4', number: 'SUB-2026-008', date: '2026-08-01', amount: 1200, plan: 'pro', status: 'paid' },
  { id: 'b3', number: 'SUB-2026-007', date: '2026-07-01', amount: 1200, plan: 'pro', status: 'paid' },
  { id: 'b2', number: 'SUB-2026-006', date: '2026-06-01', amount: 1200, plan: 'pro', status: 'paid' },
  { id: 'b1', number: 'SUB-2026-005', date: '2026-05-01', amount: 1200, plan: 'pro', status: 'paid' },
];