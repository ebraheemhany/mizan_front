'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';
import { useInvoiceStats } from '@/lib/invoices/hooks';
import { useTasks } from '@/lib/tasks/hooks';
import { useDeals } from '@/lib/deals/hooks';
import { useSlidingIndicator } from '@/lib/motion/useSlidingIndicator';
import { cn } from '@/lib/utils';
import { NAV_GROUPS, type NavItem, type NavKey } from './nav-config';

export default function SidebarNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const t = useTranslations('Nav');
  const format = useFormatter();
  const pathname = usePathname();
  // The highlighted row slides from the page you left to the one you opened.
  const { containerRef, indicatorRef } =
    useSlidingIndicator<HTMLElement>(pathname);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // Open tasks of the company (every role may read them).
  const { tasks } = useTasks();
  const openTasks = tasks.filter((task) => !task.done).length;
  // Overdue invoices, from the same stats as the invoices page (every role may read them).
  const overdueInvoices = useInvoiceStats().data?.overdueCount ?? 0;
  // Open deals on the pipeline (every role may read them).
  const openDeals = (useDeals().data?.deals ?? []).filter(
    (d) => d.stage !== 'won' && !d.lost,
  ).length;

  const liveBadge = (
    key: NavKey,
    staticBadge: NavItem['badge'],
  ): NavItem['badge'] => {
    if (key === 'tasks')
      return openTasks > 0 ? { count: openTasks, tone: 'brand' } : undefined;
    if (key === 'invoices')
      return overdueInvoices > 0
        ? { count: overdueInvoices, tone: 'danger' }
        : undefined;
    if (key === 'deals')
      return openDeals > 0 ? { count: openDeals, tone: 'brand' } : undefined;
    return staticBadge;
  };

  return (
    <nav
      ref={containerRef}
      aria-label={t('menuTitle')}
      className="group/ind relative flex flex-col gap-4 px-3"
    >
      <span
        ref={indicatorRef}
        aria-hidden="true"
        className="bg-brand-soft/80 ease-settle pointer-events-none absolute top-0 left-0 rounded-xl opacity-0 transition-[transform,width,height] duration-300 motion-reduce:transition-none"
      >
        <span className="bg-brand absolute inset-y-2 start-0 w-1 rounded-e-full" />
      </span>
      {NAV_GROUPS.map((group, index) => (
        <ul
          key={group[0]?.key ?? index}
          className={cn(
            'space-y-1.5',
            index > 0 && 'border-line border-t pt-4',
          )}
        >
          {group.map(({ key, href, icon: Icon, badge: staticBadge }) => {
            const badge = liveBadge(key, staticBadge);
            const active = isActive(href);

            return (
              <li key={key}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex min-h-11 items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold transition-colors before:absolute before:inset-y-2 before:start-0 before:w-1 before:rounded-e-full before:transition-colors',
                    active
                      ? 'bg-brand-soft/80 text-brand-deep before:bg-brand font-bold group-data-[indicator=on]/ind:bg-transparent group-data-[indicator=on]/ind:before:bg-transparent'
                      : 'text-ink-2 hover:bg-canvas hover:text-ink before:bg-transparent',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                      active
                        ? 'bg-surface/80 text-brand'
                        : 'text-muted group-hover:bg-surface group-hover:text-brand',
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1 truncate">{t(key)}</span>
                  {badge && (
                    <span
                      className={cn(
                        'min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] leading-none font-bold tabular-nums',
                        badge.tone === 'danger'
                          ? 'bg-danger-soft text-danger'
                          : 'bg-brand-soft text-brand-deep',
                      )}
                    >
                      {format.number(badge.count, { numberingSystem: 'latn' })}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ))}
    </nav>
  );
}
