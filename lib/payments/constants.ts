// lib/payments/constants.ts
// Where a payment's money goes in. Same values as the backend's payment account;
// labels are Payments.form.accounts.*
export const RECEIVING_ACCOUNTS = ['bank', 'cashbox', 'wallet'] as const;

export type ReceivingAccount = (typeof RECEIVING_ACCOUNTS)[number];
