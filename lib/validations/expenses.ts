// lib/validations/expenses.ts
import { z } from 'zod';

// الرسائل مفاتيح ترجمة، بتتترجم في الـ component
export const quickExpenseSchema = z.object({
  title: z.string().trim().min(1, 'titleRequired'),
  amount: z
    .string()
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
});

export type QuickExpenseValues = z.infer<typeof quickExpenseSchema>;