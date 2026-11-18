// lib/validations/expenses.ts
import { z } from 'zod';

// الرسائل مفاتيح ترجمة، بتتترجم في الـ component
// Same rules as the backend (POST /api/expenses), so a bad value is caught on its field
// instead of coming back as a generic validation error.
export const quickExpenseSchema = z.object({
  title: z.string().trim().min(1, 'titleRequired').max(120, 'titleTooLong'),
  amount: z
    .string()
    .trim()
    // "1,250" → "1250", ".5" → "0.5"
    .transform((v) => v.replace(/,/g, '').replace(/^\./, '0.'))
    .pipe(z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, 'amountInvalid'))
    .refine((v) => Number(v) > 0, 'amountInvalid'),
  category: z.enum([
    'salaries',
    'rent',
    'purchases',
    'marketing',
    'utilities',
    'software',
  ]),
  date: z.string().min(1, 'dateRequired'),
  /** Where the money came from. */
  paidFrom: z.enum(['bank', 'cash', 'card']),
});

export type QuickExpenseValues = z.infer<typeof quickExpenseSchema>;
