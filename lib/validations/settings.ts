// lib/validations/settings.ts
import { z } from 'zod';

// الرسائل مفاتيح ترجمة، بتتترجم في الـ component
// الحقول الاختيارية بتقبل فاضي أو صيغة صحيحة
const optional = (pattern: RegExp, message: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || pattern.test(v), message);

const companySchema = z.object({
  name: z.string().trim().min(1, 'nameRequired'),
  taxNumber: optional(/^\d{3}-?\d{3}-?\d{3}$/, 'taxNumberInvalid'),
  commercialRegister: optional(/^\d{3,15}$/, 'registerInvalid'),
  phone: optional(/^[0-9+\s-]{8,15}$/, 'phoneInvalid'),
  address: z.string().trim(),
});

// The VAT rate in percent: more than 0, at most 100, up to 2 decimals (14, 14.5).
const vatRate = z
  .string()
  .trim()
  .refine((v) => /^\d{1,3}(\.\d{1,2})?$/.test(v) && Number(v) > 0 && Number(v) <= 100, 'vatRateInvalid');

const taxesSchema = z.object({
  vatEnabled: z.boolean(),
  vatRate,
  withholdingEnabled: z.boolean(),
  currency: z.enum(['EGP', 'USD', 'SAR', 'AED']),
  fiscalStartMonth: z.string().regex(/^(?:[1-9]|1[0-2])$/),
});

const positiveInt = (message: string) =>
  z.string().trim().refine((v) => /^\d+$/.test(v) && Number(v) > 0, message);

const prefix = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9-]{1,10}$/, 'prefixInvalid');

const numberingSchema = z.object({
  invoicePrefix: prefix,
  invoiceNext: positiveInt('numberInvalid'),
  quotePrefix: prefix,
  quoteNext: positiveInt('numberInvalid'),
  paymentTermsDays: z.enum(['0', '15', '30', '45', '60']),
});
const templateSchema = z.object({
  style: z.enum(['classic', 'modern', 'minimal']),
  footer: z.string().trim().max(200, 'footerTooLong'),
});

const notificationsSchema = z.object({
  customerReminders: z.boolean(),
  overdueInvoice: z.boolean(),
  newPayment: z.boolean(),
  taskReminder: z.boolean(),
  weeklyDigest: z.boolean(),
});

const integrationsSchema = z.object({
  whatsapp: z.boolean(),
  paymentGateway: z.boolean(),
  eta: z.boolean(),
  calendar: z.boolean(),
});

export const settingsSchema = z.object({
  company: companySchema,
  taxes: taxesSchema,
  numbering: numberingSchema,
  template: templateSchema,
   notifications: notificationsSchema,
  integrations: integrationsSchema,
});
export type SettingsValues = z.infer<typeof settingsSchema>;