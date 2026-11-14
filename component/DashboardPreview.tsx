// src/components/landing/DashboardPreview.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import {
  BarChart3,
  FileText,
  Home,
  Kanban,
  Receipt,
  Users,
} from 'lucide-react';
import {
  DASHBOARD_ALERTS,
  DASHBOARD_EXPENSES,
  DASHBOARD_REVENUE,
  DASHBOARD_STATS,
} from '@/lib/dashboard-data';

const NAV = [
  { key: 'home', icon: Home, active: true },
  { key: 'customers', icon: Users },
  { key: 'deals', icon: Kanban },
  { key: 'invoices', icon: FileText },
  { key: 'expenses', icon: Receipt },
  { key: 'reports', icon: BarChart3 },
] as const;

function useInView<T extends Element>(threshold = 0.1) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function CountUp({
  to,
  start,
  duration = 1400,
}: {
  to: number;
  start: boolean;
  duration?: number;
}) {
  const format = useFormatter();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, to, duration]);

  // numberingSystem: 'latn' يخلي الأرقام 123 حتى في العربي
  return (
    <span className="tabular-nums">
      {format.number(value, { numberingSystem: 'latn' })}
    </span>
  );
}

export default function DashboardPreview() {
  const t = useTranslations('DashboardPreview');
  const tf = useTranslations('Footer');
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`rounded-card border-line bg-surface flex w-full max-w-6xl overflow-hidden border text-start shadow-sm transition-all duration-700 motion-reduce:transition-none ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      {/* Sidebar */}
      <aside className="border-line w-44 shrink-0 border-e p-4">
        <div className="mb-5 flex items-center gap-2 px-2">
          <span className="bg-brand size-4 rounded-md" />
          <span className="text-ink text-sm font-extrabold">
            {tf('brandName')}
          </span>
        </div>
        <nav className="space-y-1">
          {NAV.map(({ key, icon: Icon, ...rest }) => (
            <div
              key={key}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold ${
                'active' in rest
                  ? 'bg-brand-soft text-brand-deep'
                  : 'text-ink-2'
              }`}
            >
              <Icon className="size-3.5" />
              {t(`nav.${key}`)}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="bg-canvas min-w-0 flex-1 space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DASHBOARD_STATS.map((s) => (
            <div
              key={s.key}
              className="border-line bg-surface rounded-xl border p-3"
            >
              <p className="text-muted text-[11px]">{t(`stats.${s.key}`)}</p>
              <p className="text-ink mt-1 text-lg font-extrabold">
                <CountUp to={s.value} start={inView} />
                <span className="text-muted ms-1 text-[10px] font-semibold">
                  {t('currency')}
                </span>
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_16rem]">
          {/* Chart */}
          <div className="border-line bg-surface rounded-xl border p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-ink text-xs font-bold">{t('chart.title')}</h3>
              <div className="text-muted flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <i className="bg-brand size-2 rounded-full" />{' '}
                  {t('chart.revenue')}
                </span>
                <span className="flex items-center gap-1">
                  <i className="size-2 rounded-full bg-[#dba35a]" />{' '}
                  {t('chart.expenses')}
                </span>
              </div>
            </div>

            <div className="flex h-62 items-end justify-between px-3">
              {DASHBOARD_REVENUE.map((rev, i) => (
                <div key={i} className="flex h-full items-end gap-1.5">
                  <div
                    className="bg-brand w-2.5 rounded-t-[3px] transition-[height] duration-1000 ease-out motion-reduce:transition-none"
                    style={{
                      height: inView ? `${rev}%` : '0%',
                      transitionDelay: `${i * 90}ms`,
                    }}
                  />
                  <div
                    className="w-2.5 rounded-t-[3px] bg-[#dba35a] transition-[height] duration-1000 ease-out motion-reduce:transition-none"
                    style={{
                      height: inView ? `${DASHBOARD_EXPENSES[i]}%` : '0%',
                      transitionDelay: `${i * 90 + 60}ms`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="border-line bg-surface rounded-xl border p-4">
            <h3 className="text-ink mb-3 text-xs font-bold">
              {t('alerts.title')}
            </h3>
            <ul className="divide-line divide-y">
              {DASHBOARD_ALERTS.map((a) => (
                <li
                  key={a.key}
                  className="flex items-center justify-between gap-2 py-2.5 text-[11px]"
                >
                  <span className="text-ink-2">{t(`alerts.${a.key}`)}</span>
                  <span
                    className={`shrink-0 font-bold ${
                      a.tone === 'danger' ? 'text-danger' : 'text-amber-700'
                    }`}
                  >
                    {t('days', { count: a.days })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
