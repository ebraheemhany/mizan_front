// lib/validations/invoice.ts
import { z } from 'zod';

type InvoiceFormMessages = {
  customerRequired: string;
  dateRequired: string;
  descriptionRequired: string;
  quantityInvalid: string;
  priceInvalid: string;
  notesMax: string;
};

export const TERMS = [0, 15, 30, 60] as const;
export const VAT_RATE = 14;

// بيقبل "1,000" و"1 000" كمان
export const parseNumber = (v: string) => Number(v.replace(/[,\s]/g, ''));

export const createInvoiceSchema = (m: InvoiceFormMessages) =>
  z.object({
    customerId: z.string().min(1, m.customerRequired),
    issueDate: z.string().min(1, m.dateRequired),
    terms: z.number(),
    items: z
      .array(
        z.object({
          description: z.string().trim().min(1, m.descriptionRequired),
          quantity: z.string().trim().refine((v) => {
            const n = parseNumber(v);
            return Number.isFinite(n) && n > 0;
          }, m.quantityInvalid),
          unitPrice: z.string().trim().refine((v) => {
            const n = parseNumber(v);
            return v !== '' && Number.isFinite(n) && n >= 0;
          }, m.priceInvalid),
        }),
      )
      .min(1),
    notes: z.string().max(500, m.notesMax),
  });

export type InvoiceFormValues = z.infer<ReturnType<typeof createInvoiceSchema>>;
export type InvoiceFormItem = InvoiceFormValues['items'][number];

export function lineAmount(item: { quantity: string; unitPrice: string }) {
  const q = parseNumber(item.quantity);
  const p = parseNumber(item.unitPrice);
  return Number.isFinite(q) && Number.isFinite(p) ? q * p : 0;
}

export function calcTotals(items: { quantity: string; unitPrice: string }[]) {
  const subtotal = Math.round(items.reduce((sum, i) => sum + lineAmount(i), 0) * 100) / 100;
  // الضريبة بالقروش مش بالجنيه، علشان فاتورة زي 10.50 ضريبتها 1.47 مش 1
  const vat = Math.round(subtotal * VAT_RATE) / 100;
  return { subtotal, vat, total: Math.round((subtotal + vat) * 100) / 100 };
}