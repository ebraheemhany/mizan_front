// lib/validations/tasks.ts
import { z } from 'zod';

// الرسائل مفاتيح ترجمة، بتتترجم في الـ component
export const taskSchema = z
  .object({
    title: z.string().trim().min(1, 'titleRequired'),
    due: z.string().min(1, 'dueRequired'),
    priority: z.enum(['urgent', 'important', 'normal']),
    kind: z.enum([
      'meeting',
      'quote',
      'collection',
      'visit',
      'deadline',
      'admin',
    ]),
    linkType: z.enum(['none', 'customer', 'deal']),
    linkName: z.string().trim(),
  })
  .refine((v) => v.linkType === 'none' || v.linkName.length > 0, {
    path: ['linkName'],
    message: 'linkNameRequired',
  });

export type TaskFormValues = z.infer<typeof taskSchema>;