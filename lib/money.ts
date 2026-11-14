// lib/money.ts
'use client';
import { useFormatter, useLocale } from 'next-intl';


// TODO: العملة هتيجي من إعدادات الشركة
export const DEFAULT_CURRENCY = 'EGP';

export function useMoney() {
  const format = useFormatter();

  return (amount: number, currency: string = DEFAULT_CURRENCY) =>
    format.number(amount, {
      style: 'currency',
      currency,
      numberingSystem: 'latn',
      maximumFractionDigits: 0,
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
