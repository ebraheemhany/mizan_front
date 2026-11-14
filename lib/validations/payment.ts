// lib/validations/payment.ts
import { z } from 'zod';

type PaymentMessages = {
  amountRequired: string;
  amountInvalid: string;
  amountMax: string;
  dateRequired: string;
  noteMax: string;
};

export const PAYMENT_METHODS = ['bank', 'cash', 'card'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// بيقبل "1,000" و"1 000" كمان
export const parseAmount = (v: string) => Number(v.replace(/[,\s]/g, ''));

export const createPaymentSchema = (m: PaymentMessages, remaining: number) =>
  z.object({
    amount: z
      .string()
      .trim()
      .min(1, m.amountRequired)
      .refine((v) => {
        const n = parseAmount(v);
        return Number.isFinite(n) && n > 0;
      }, m.amountInvalid)
      .refine((v) => parseAmount(v) <= remaining, m.amountMax),
    date: z.string().min(1, m.dateRequired),
    method: z.enum(PAYMENT_METHODS),
    note: z.string().max(200, m.noteMax),
  });

export type PaymentValues = z.infer<ReturnType<typeof createPaymentSchema>>;