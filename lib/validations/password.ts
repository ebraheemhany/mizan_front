// lib/validations/password.ts

import { z } from 'zod';

const passwordField = z.string().min(1, 'passwordRequired');
const newPasswordField = passwordField.min(8, 'passwordMin');

export const changePasswordSchema = z
  .object({
    current: passwordField,
    next: newPasswordField,
    confirm: z.string().min(1, 'confirmRequired'),
  })
  .refine((v) => v.next === v.confirm, {
    message: 'passwordMismatch',
    path: ['confirm'],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

/** An account made with Google setting its first password: there's no current one. */
export const setPasswordSchema = z
  .object({
    current: z.string(),
    next: newPasswordField,
    confirm: z.string().min(1, 'confirmRequired'),
  })
  .refine((v) => v.next === v.confirm, {
    message: 'passwordMismatch',
    path: ['confirm'],
  });