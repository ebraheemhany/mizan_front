// component/admin/admin-ui.tsx
// Small pieces shared by the platform admin pages.
'use client';

import { useFormatter, useNow, useTranslations } from 'next-intl';
import type { PlanId, SubscriptionStatus } from '@/lib/admin/hooks';
import { cn } from '@/lib/utils';

const PLAN_STYLE: Record<PlanId, string> = {
  free: 'bg-canvas text-muted ring-line',
  pro: 'bg-brand-soft text-brand-deep ring-brand/15',
  business: 'bg-amber-50 text-amber-800 ring-amber-200',
};

export function PlanBadge({ plan }: { plan: PlanId }) {
  const t = useTranslations('Admin.plans');
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1', PLAN_STYLE[plan])}>{t(plan)}</span>
  );
}

/** How a paid subscription stands: renewing, ending, or a renewal not paid yet. */
export function useSubscriptionNote() {
  const t = useTranslations('Admin.subscription');
  const date = useShortDate();
  return (s: { status: SubscriptionStatus; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null) => {
    if (!s || s.status === 'ended' || !s.currentPeriodEnd) return null;
    if (s.status === 'pastDue') return { text: t('pastDue'), tone: 'danger' as const };
    const end = date(s.currentPeriodEnd);
    return s.cancelAtPeriodEnd ? { text: t('endsOn', { date: end }), tone: 'warning' as const } : { text: t('renewsOn', { date: end }), tone: 'muted' as const };
  };
}

export function useShortDate() {
  const format = useFormatter();
  return (value: string) =>
    format.dateTime(new Date(value.includes('T') ? value : `${value}T00:00:00Z`), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      numberingSystem: 'latn',
      timeZone: value.includes('T') ? 'Africa/Cairo' : 'UTC',
    });
}

/** "3 hours ago", or "never" for nobody signed in since tokens were cleaned up. */
export function useLastActive() {
  const format = useFormatter();
  const t = useTranslations('Admin');
  // Re-rendered each minute, so "just now" moves on.
  const now = useNow({ updateInterval: 60_000 });
  return (value: string | null) => (value ? format.relativeTime(new Date(value), now) : t('never'));
}

export function useCount() {
  const format = useFormatter();
  return (value: number) => format.number(value, { numberingSystem: 'latn' });
}
