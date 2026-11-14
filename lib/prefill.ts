// lib/prefill.ts
import { CUSTOMERS } from '@/lib/mock/customers';
import type { QuoteDetail } from '@/lib/mock/quote-details';
import { TODAY, type Quote } from '@/lib/mock/quotes';
import {
  VAT_RATE,
  type InvoiceFormValues,
} from '@/lib/validations/invoice';

// بيحوّل عرض السعر لقيم نموذج الفاتورة
// TODO: لما نربط الـ API البنود بتيجي كاملة من العرض نفسه
export function quoteToInvoiceValues(
  q: QuoteDetail | Quote,
  note: string,
): InvoiceFormValues {
  const items =
    'lines' in q
      ? q.lines.map((line) => ({
          description: line.description
            ? `${line.title} — ${line.description}`
            : line.title,
          quantity: String(line.quantity),
          unitPrice: String(line.unitPrice),
        }))
      : q.items?.length
        ? q.items.map((item) => ({
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
          }))
        : [
            {
              description: 'خدمات — بحسب الاتفاق',
              quantity: '1',
              unitPrice: String(Math.round(q.total / (1 + VAT_RATE / 100))),
            },
          ];

  return {
    customerId:
      CUSTOMERS.find((c) => c.name === q.customer)?.id ?? `quote-${q.number}`,
    issueDate: TODAY,
    terms: 30,
    items,
    notes: q.notes?.trim() || note,
  };
}