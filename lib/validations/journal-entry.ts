// lib/validations/journal-entry.ts
import { z } from 'zod';

/** "50,000.5" -> cents (commas allowed while typing; the server strips them too). */
export const toCents = (v: string) => Math.round((Number(v.replace(/,/g, '')) || 0) * 100);

const amountField = z
  .string()
  .refine((v) => {
    const plain = v.replace(/,/g, '').trim();
    return plain === '' || /^\d{1,12}(\.\d{1,2})?$/.test(plain);
  }, 'amountInvalid');

const lineSchema = z.object({
  accountId: z.string().min(1, 'accountRequired'),
  debit: amountField,
  credit: amountField,
});

export const manualEntrySchema = z
  .object({
    date: z.string().min(1, 'dateRequired'),
    description: z.string().trim().min(1, 'descriptionRequired').max(200, 'descriptionMax'),
    lines: z.array(lineSchema).min(2, 'linesMin'),
  })
  .superRefine((v, ctx) => {
    let debit = 0;
    let credit = 0;

    v.lines.forEach((l, i) => {
      const d = toCents(l.debit);
      const c = toCents(l.credit);
      debit += d;
      credit += c;

      // Each line is a debit or a credit, never both or neither.
      if ((d > 0) === (c > 0)) {
        ctx.addIssue({ code: 'custom', message: 'lineOneSide', path: ['lines', i, 'debit'] });
      }
    });

    if (debit !== credit) {
      ctx.addIssue({ code: 'custom', message: 'unbalanced', path: ['lines'] });
    }
  });

export type ManualEntryValues = z.infer<typeof manualEntrySchema>;
