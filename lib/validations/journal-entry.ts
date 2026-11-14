// lib/validations/journal-entry.ts
import { z } from 'zod';

// الدوال المساعدة والـ schemas الفرعية الأول
const toCents = (v: string) => Math.round((Number(v) || 0) * 100);

const amountField = z.string().regex(/^\d*(\.\d{0,2})?$/, 'amountInvalid');

const lineSchema = z.object({
  account: z.string().min(1, 'accountRequired'),
  debit: amountField,
  credit: amountField,
});

// الـ schema الرئيسي
export const manualEntrySchema = z
  .object({
    date: z.string().min(1, 'dateRequired'),
    description: z.string().trim().min(1, 'descriptionRequired').max(120, 'descriptionMax'),
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

      if ((d > 0) === (c > 0)) {
        ctx.addIssue({
          code: 'custom',
          message: 'lineOneSide',
          path: ['lines', i, 'debit'],
        });
      }
    });

    if (debit !== credit) {
      ctx.addIssue({ code: 'custom', message: 'unbalanced', path: ['lines'] });
    }
  });

export type ManualEntryValues = z.infer<typeof manualEntrySchema>;