// lib/validations/payments.ts
import { z } from 'zod';

// الرسائل مفاتيح ترجمة، بتتترجم في الـ component
export const paymentSchema = z.object({
  invoice: z.string().min(1, 'invoiceRequired'),
  amount: z.string().refine((v) => Number(v) > 0, 'amountInvalid'),
  date: z.string().min(1, 'dateRequired'),
  method: z.enum(['bankTransfer', 'cash', 'instapay', 'vodafoneCash', 'cheque']),
  account: z.enum(['bankAhli', 'cashbox', 'wallet']),
  reference: z.string().trim(),
  note: z.string().trim(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;