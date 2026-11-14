// components/app/Amount.tsx
'use client';

import { useMoneyParts } from '@/lib/money';

export default function Amount({ amount }: { amount: number }) {
  const parts = useMoneyParts();
  const { number, symbol } = parts(amount);

  return (
    <>
      {number}
      <span className="text-muted ms-1.5 text-xs font-semibold">{symbol}</span>
    </>
  );
}