'use client';

import { useLocale } from 'next-intl';
import { rtlLocales } from '@/i18n/routing';

export function useDir(): 'rtl' | 'ltr' {
  const locale = useLocale();
  return rtlLocales.includes(locale) ? 'rtl' : 'ltr';
}