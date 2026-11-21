// component/dashbord/PlanCard.tsx
'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { AlertTriangle, ArrowUpRight, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useBilling } from '@/lib/billing/hooks';
import { cn } from '@/lib/utils';
import { UpgradePlanDialog } from './settings/UpgradePlanDialog';

export default function PlanCard() {
  const t = useTranslations('PlanCard');
  const format = useFormatter();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { data } = useBilling();
  if (!data) return null;

  // A renewal that wasn't paid: say so until it is (or the plan ends).
  if (data.subscription?.status === 'pastDue') {
    return (
      <Link
        href="/settings#subscription"
        className="flex items-start gap-3 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-[0_12px_30px_rgba(35,55,45,0.06)]"
      >
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span className="text-xs leading-5">
          <span className="block font-extrabold">{t('pastDue')}</span>
          {t('pastDueHint')}
        </span>
      </Link>
    );
  }
  // Paid plans have no monthly limit to show.
  if (data.usage.invoicesLimit === null) return null;

  // Invoices made this month (any status), counted by the server as the limit counts them.
  const invoicesUsed = data.usage.invoicesThisMonth;
  const invoicesLimit = data.usage.invoicesLimit;
  const ratio = Math.min(invoicesUsed / invoicesLimit, 1);
  const nearLimit = ratio >= 0.9;

  const num = (v: number) => format.number(v, { numberingSystem: 'latn' });

  return (
    <div className="rounded-[24px] border border-[#dfe9e5] bg-white p-4 text-[#0b251d] shadow-[0_12px_30px_rgba(35,55,45,0.06)]">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f7f1] text-[#00704a]">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-wide text-[#00704a]">
            {t('title')}
          </p>
          <p className="mt-1 text-xs font-extrabold text-[#0b251d]">
            {t('usage', { used: num(invoicesUsed), limit: num(invoicesLimit) })}
          </p>
        </div>
      </div>

      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8f1ed]"
        role="progressbar"
        aria-valuenow={invoicesUsed}
        aria-valuemin={0}
        aria-valuemax={invoicesLimit}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-300',
            nearLimit ? 'bg-danger' : 'bg-[#0a7b5a]',
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>

      <Button
        type="button"
        onClick={() => setUpgradeOpen(true)}
        className="mt-4 h-10 w-full rounded-xl bg-[#0a7b5a] text-xs font-bold text-white shadow-sm transition hover:bg-[#005739] hover:shadow-md"
      >
        <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        {t('upgrade')}
      </Button>

      <UpgradePlanDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
