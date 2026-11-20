// lib/validations/recurring.ts
import { z } from 'zod';
import { parseNumber } from './invoice';

export const FREQUENCIES = ['weekly', 'monthly', 'quarterly', 'yearly'] as const;
export const END_MODES = ['never', 'date', 'count'] as const;

type RecurringMessages = {
  nameRequired: string;
  nameMax: string;
  customerRequired: string;
  dateRequired: string;
  endDateRequired: string;
  endDateAfter: string;
  occurrencesInvalid: string;
  descriptionRequired: string;
  quantityInvalid: string;
  priceInvalid: string;
  notesMax: string;
};

export const createRecurringSchema = (m: RecurringMessages) =>
  z
    .object({
      name: z.string().trim().min(1, m.nameRequired).max(80, m.nameMax),
      customerId: z.string().min(1, m.customerRequired),
      frequency: z.enum(FREQUENCIES),
      startDate: z.string().min(1, m.dateRequired),
      endMode: z.enum(END_MODES),
      endDate: z.string(),
      occurrences: z.string(),
      terms: z.number(),
      autoSend: z.boolean(),
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
            // A line picked from the catalog keeps its link when the template is edited.
            productId: z.string().nullable().optional(),
          }),
        )
        .min(1),
      notes: z.string().max(500, m.notesMax),
    })
    .superRefine((v, ctx) => {
      if (v.endMode === 'date') {
        if (!v.endDate) {
          ctx.addIssue({ code: 'custom', path: ['endDate'], message: m.endDateRequired });
        } else if (v.endDate <= v.startDate) {
          ctx.addIssue({ code: 'custom', path: ['endDate'], message: m.endDateAfter });
        }
      }

      if (v.endMode === 'count') {
        const n = parseNumber(v.occurrences);
        if (!Number.isInteger(n) || n < 1 || n > 120) {
          ctx.addIssue({ code: 'custom', path: ['occurrences'], message: m.occurrencesInvalid });
        }
      }
    });

export type RecurringFormValues = z.infer<ReturnType<typeof createRecurringSchema>>;