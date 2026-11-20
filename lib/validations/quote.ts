import { z } from 'zod';
import { parseNumber } from './invoice';

type QuoteFormMessages = {
  customerRequired: string;
  issueDateRequired: string;
  validUntilRequired: string;
  validUntilAfterIssue: string;
  descriptionRequired: string;
  quantityInvalid: string;
  priceInvalid: string;
  notesMax: string;
};

export const createQuoteSchema = (m: QuoteFormMessages) =>
  z
    .object({
      customerId: z.string().min(1, m.customerRequired),
      issueDate: z.string().min(1, m.issueDateRequired),
      validUntil: z.string().min(1, m.validUntilRequired),
      items: z
        .array(
          z.object({
            description: z.string().trim().min(1, m.descriptionRequired),
            quantity: z.string().trim().refine((value) => {
              const quantity = parseNumber(value);
              return Number.isFinite(quantity) && quantity > 0;
            }, m.quantityInvalid),
            unitPrice: z.string().trim().refine((value) => {
              const price = parseNumber(value);
              return value !== '' && Number.isFinite(price) && price >= 0;
            }, m.priceInvalid),
            // Not shown: kept so editing a draft keeps its lines' link to a product.
            productId: z.string().nullable().optional(),
          }),
        )
        .min(1),
      notes: z.string().max(500, m.notesMax),
    })
    .refine((value) => value.validUntil > value.issueDate, {
      message: m.validUntilAfterIssue,
      path: ['validUntil'],
    });

export type QuoteFormValues = z.infer<ReturnType<typeof createQuoteSchema>>;
