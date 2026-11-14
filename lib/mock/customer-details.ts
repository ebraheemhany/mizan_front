// lib/mock/customer-details.ts
import { CUSTOMERS, OWNERS, type Customer } from './customers';
import { INVOICES, type Invoice } from './invoices';

export type CustomerDetail = {
  customer: Customer;
  ownerName: string;
  invoices: Invoice[];
  billableCount: number;
  totalInvoiced: number;
  collected: number;
};

// TODO: لما نربط الـ API الصفحة دي بتجيب العميل وفواتيره من الباك إند
export function getCustomerDetail(id: string): CustomerDetail | undefined {
  const customer = CUSTOMERS.find((c) => c.id === id);
  if (!customer) return undefined;

  const invoices = INVOICES.filter((i) => i.customer === customer.name).sort(
    (a, b) => b.number - a.number,
  );

  // المسودات والملغاة مش بتتحسب في الإجماليات
  const billable = invoices.filter((i) => i.status !== 'draft' && i.status !== 'cancelled');

  return {
    customer,
    ownerName: OWNERS.find((o) => o.id === customer.ownerId)?.name ?? '',
    invoices,
    billableCount: billable.length,
    totalInvoiced: billable.reduce((sum, i) => sum + i.total, 0),
    collected: billable.reduce((sum, i) => sum + (i.total - i.remaining), 0),
  };
}