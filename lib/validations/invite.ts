// lib/validations/invite.ts
import { z } from 'zod';

// الرسائل مفاتيح ترجمة، بتتترجم في الـ component
export const inviteSchema = z.object({
  name: z.string().trim().min(1, 'nameRequired'),
  email: z.string().trim().email('emailInvalid'),
  role: z.enum(['accountant', 'sales', 'viewer']),
});

export type InviteValues = z.infer<typeof inviteSchema>;