// lib/validations/tasks.ts
import { z } from 'zod';

// الرسائل مفاتيح ترجمة، بتتترجم في الـ component
export const taskSchema = z.object({
  title: z.string().trim().min(1, 'titleRequired').max(200, 'titleTooLong'),
  due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dueRequired'),
  priority: z.enum(['urgent', 'important', 'normal']),
  kind: z.enum([
    'meeting',
    'quote',
    'collection',
    'visit',
    'deadline',
    'admin',
  ]),
  // العميل اختياري؛ الاسم محفوظ علشان يتعرض في الحقل
  customer: z.object({ id: z.string(), name: z.string() }).nullable(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
