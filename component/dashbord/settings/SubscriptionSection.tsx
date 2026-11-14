// component/dashbord/settings/SubscriptionSection.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { BillingHistorySheet } from './BillingHistorySheet';
import { UpgradePlanDialog } from './UpgradePlanDialog';
import { PlanId } from '@/lib/mock/plan';
// TODO: بيانات الاشتراك من الـ API
const SUBSCRIPTION = {
  plan: 'pro' as PlanId,
  renewsAt: '2026-11-01',
  usersUsed: 4,
  usersTotal: 10,
};

export function SubscriptionSection() {
  const t = useTranslations('Settings.subscription');
  const format = useFormatter();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { usersUsed, usersTotal } = SUBSCRIPTION;
  const pct = Math.min(100, Math.round((usersUsed / usersTotal) * 100));
  const num = (n: number) => format.number(n, { numberingSystem: 'latn' });

  const renewal = format.dateTime(new Date(SUBSCRIPTION.renewsAt), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  });

  const row = 'flex items-center justify-between gap-4 py-3.5';

  return (
    <section
      id="subscription"
      className="rounded-card border-line bg-surface scroll-mt-24 border p-6 shadow-sm"
    >
      <h2 className="text-ink mb-2 text-base font-extrabold">{t('title')}</h2>

      <div className="divide-line divide-y">
        <div className={row}>
          <span className="text-muted text-sm">{t('currentPlan')}</span>
          <span className="text-ink text-sm font-bold">
            {t(`plans.${SUBSCRIPTION.plan}`)}
          </span>
        </div>
        <div className={row}>
          <span className="text-muted text-sm">{t('nextRenewal')}</span>
          <span className="text-ink text-sm font-bold">{renewal}</span>
        </div>
        <div className={row}>
          <span className="text-muted text-sm">{t('users')}</span>
          <span className="text-ink text-sm font-bold">
            {t('usersOf', { used: num(usersUsed), total: num(usersTotal) })}
          </span>
        </div>
      </div>

      <div
        className="bg-neutral-soft mt-1 h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={usersUsed}
        aria-valuemin={0}
        aria-valuemax={usersTotal}
      >
        <div
          className="bg-brand h-full rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setHistoryOpen(true)}
          className="border-line-strong h-10 text-xs font-bold"
        >
          {t('billingHistory')}
        </Button>
        <Button
          type="button"
          onClick={() => setUpgradeOpen(true)}
          className="bg-brand hover:bg-brand-deep h-10 text-xs font-bold text-white"
        >
          {t('upgrade')}
        </Button>
      </div>
      <BillingHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
      <UpgradePlanDialog
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        currentPlan={SUBSCRIPTION.plan}
      />
    </section>
  );
}
