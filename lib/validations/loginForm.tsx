// src/lib/validations/auth.ts
import { z } from 'zod';

type LoginMessages = {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordMin: string;
};

export const createLoginSchema = (m: LoginMessages) =>
  z.object({
    email: z.string().min(1, m.emailRequired).email(m.emailInvalid),
    password: z.string().min(1, m.passwordRequired).min(8, m.passwordMin),
    remember: z.boolean(),
  });

type RegisterMessages = {
  fullNameRequired: string;
  fullNameMin: string;
  companyRequired: string;
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordMin: string;
  confirmRequired: string;
  passwordMismatch: string;
  termsRequired: string;
};

export const createRegisterSchema = (m: RegisterMessages) =>
  z
    .object({
      fullName: z
        .string()
        .trim()
        .min(1, m.fullNameRequired)
        .min(3, m.fullNameMin),
      companyName: z.string().trim().min(1, m.companyRequired),
      email: z.string().min(1, m.emailRequired).email(m.emailInvalid),
      password: z.string().min(1, m.passwordRequired).min(8, m.passwordMin),
      confirmPassword: z.string().min(1, m.confirmRequired),
      terms: z.boolean().refine((v) => v, m.termsRequired),
    })
    .refine((d) => d.password === d.confirmPassword, {
      path: ['confirmPassword'],
      message: m.passwordMismatch,
    });

export type RegisterValues = z.infer<ReturnType<typeof createRegisterSchema>>;

// 0 → 4: عدد الشروط المتحققة (طول 8+، حروف كبيرة وصغيرة، رقم، رمز)
export function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length < 8) score = Math.min(score, 1);
  return Math.max(score, 1) as 1 | 2 | 3 | 4;
}

export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;
