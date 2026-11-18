// lib/money.ts
'use client';
import { useFormatter, useLocale } from 'next-intl';


// TODO: العملة هتيجي من إعدادات الشركة
export const DEFAULT_CURRENCY = 'EGP';

/** Money as text: whole pounds, or with `{ cents: true }` always 2 decimals (statements, VAT). */
export function useMoney({ cents = false }: { cents?: boolean } = {}) {
  const format = useFormatter();

  return (amount: number, currency: string = DEFAULT_CURRENCY) =>
    format.number(amount, {
      style: 'currency',
      currency,
      numberingSystem: 'latn',
      ...(cents ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 }),
    });
}




export function useMoneyParts() {
  const locale = useLocale();

  return (amount: number, currency: string = DEFAULT_CURRENCY) => {
    const parts = new Intl.NumberFormat(`${locale}-u-nu-latn`, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).formatToParts(amount);

    return {
      number: parts
        .filter((p) => p.type !== 'currency' && p.type !== 'literal')
        .map((p) => p.value)
        .join(''),
      symbol: parts
        .filter((p) => p.type === 'currency')
        .map((p) => p.value)
        .join(''),
    };
  };
}
