// lib/validations/products.ts
import { z } from 'zod';

// الرسائل مفاتيح ترجمة، بتتترجم في الـ component
export const itemSchema = z
  .object({
    name: z.string().trim().min(1, 'nameRequired'),
    type: z.enum(['service', 'product']),
    code: z.string().trim().min(1, 'codeRequired'),
    price: z.string().refine((v) => v !== '' && Number(v) >= 0, 'priceInvalid'),
    taxRate: z
      .string()
      .refine((v) => v !== '' && Number(v) >= 0 && Number(v) <= 100, 'taxInvalid'),
    category: z.enum([
      'software',
      'support',
      'consulting',
      'devices',
      'network',
      'accessories',
    ]),
    stock: z.string(),
    lowStockAt: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.type !== 'product') return;
    for (const key of ['stock', 'lowStockAt'] as const) {
      if (v[key] === '' || Number(v[key]) < 0) {
        ctx.addIssue({ code: 'custom', path: [key], message: 'stockInvalid' });
      }
    }
  });

export type ItemFormValues = z.infer<typeof itemSchema>;