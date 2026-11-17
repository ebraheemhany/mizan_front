// lib/validations/customer.ts
import { z } from 'zod';
import type { Customer } from '@/lib/mock/customers';
type CustomerMessages = {
  nameRequired: string;
  nameMax: string;
  phoneInvalid: string;
  emailInvalid: string;
  notesMax: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s-]{8,15}$/;

export const createCustomerSchema = (m: CustomerMessages) =>
  z.object({
    name: z.string().trim().min(1, m.nameRequired).max(80, m.nameMax),
    contact: z.string().trim().max(80),
    phone: z.string().trim().refine((v) => v === '' || PHONE.test(v), m.phoneInvalid),
    email: z.string().trim().refine((v) => v === '' || EMAIL.test(v), m.emailInvalid),
    city: z.string().trim().max(60),
    ownerId: z.string().min(1),
    taxNumber: z.string().trim().max(30),
    notes: z.string().max(500, m.notesMax),
  });

export type CustomerFormValues = z.infer<ReturnType<typeof createCustomerSchema>>;



// بيحوّل العميل لقيم النموذج (الحقول الفاضية بتبقى نص فاضي)
export function customerToFormValues(c: Customer): CustomerFormValues {
  return {
    name: c.name,
    contact: c.contact,
    phone: c.phone,
    email: c.email,
    city: c.city,
    ownerId: c.ownerId,
    taxNumber: c.taxNumber ?? '',
    notes: c.notes ?? '',
  };
}
