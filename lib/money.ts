// lib/money.ts
'use client';
import { createContext, createElement, useContext, type ReactNode } from 'react';
import { useFormatter, useLocale } from 'next-intl';

/** Before the company's currency is known (and outside the app). */
export const DEFAULT_CURRENCY = 'EGP';

const CurrencyContext = createContext<string>(DEFAULT_CURRENCY);

/**
 * The currency every amount below is shown in: the company's (from the session) in
 * the app, the document's on a page shared with a customer.
 */
export function CurrencyProvider({ currency, children }: { currency: string | null | undefined; children: ReactNode }) {
  // Intl only takes ISO codes (EGP, USD...); anything else falls back to the default.
  const value = currency && /^[A-Z]{3}$/.test(currency) ? currency : DEFAULT_CURRENCY;
  return createElement(CurrencyContext.Provider, { value }, children);
}

/** The currency amounts are shown in here (see CurrencyProvider). */
export function useCurrency() {
  return useContext(CurrencyContext);
}

/** Money as text in the current currency: whole units, or with `{ cents: true }` always 2 decimals (statements, VAT). */
export function useMoney({ cents = false }: { cents?: boolean } = {}) {
  const format = useFormatter();
  const fallback = useCurrency();

  return (amount: number, currency: string = fallback) =>
    format.number(amount, {
      style: 'currency',
      currency,
      numberingSystem: 'latn',
      ...(cents ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 }),
    });
}

export function useMoneyParts() {
  const locale = useLocale();
  const fallback = useCurrency();

  return (amount: number, currency: string = fallback) => {
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
