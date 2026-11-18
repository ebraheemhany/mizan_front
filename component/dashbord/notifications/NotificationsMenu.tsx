// component/dashbord/notifications/NotificationsMenu.tsx
'use client';

import { useMemo, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import {
  Bell,
  BellRing,
  CalendarClock,
  ListChecks,
  Receipt,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from '@/i18n/navigation';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import {
  buildNotifications,
  type AppNotification,
  type NotificationKind,
} from './utils';
import { useTasks } from '@/component/dashbord/AppDataProvider';
import { useExpenses } from '@/lib/expenses/hooks';
import { useOpenInvoices } from '@/lib/payments/hooks';

const ICON: Record<NotificationKind, { Icon: LucideIcon; tone: string }> = {
  receivableOverdue: { Icon: Receipt, tone: 'bg-danger-soft text-danger' },
  taskOverdue: { Icon: ListChecks, tone: 'bg-danger-soft text-danger' },
  taskToday: { Icon: CalendarClock, tone: 'bg-info-soft text-info' },
  expenseDue: { Icon: Wallet, tone: 'bg-amber-50 text-amber-800' },
};

const iconBtn =
  'border-line-strong bg-surface text-ink-2 hover:bg-canvas focus-visible:ring-brand/30 rounded-btn relative flex size-10 items-center justify-center border transition-colors outline-none focus-visible:ring-2';

export default function NotificationsMenu() {
  const t = useTranslations('Notifications');
  const format = useFormatter();
  const money = useMoney();
  const router = useRouter();

  const { tasks } = useTasks();
  const { expenses } = useExpenses();
  // Overdue balances per customer come from the open invoices (any role may read them).
  const openInvoices = useOpenInvoices().data;
  const all = useMemo(
    () => buildNotifications(openInvoices ?? [], tasks, expenses),
    [openInvoices, tasks, expenses],
  );
  const [read, setRead] = useState<Set<string>>(new Set());

  const unread = all.filter((n) => !read.has(n.id)).length;

  const num = (v: number) => format.number(v, { numberingSystem: 'latn' });

  const date = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
      numberingSystem: 'latn',
    });

  function hint(n: AppNotification) {
    // A due expense may have no due date: show just the amount, not a dangling "due".
    if (n.kind === 'expenseDue' && !n.date) {
      return t('items.expenseDue.hintNoDate', { amount: n.amount !== undefined ? money(n.amount) : '' });
    }
    return t(`items.${n.kind}.hint`, {
      date: n.date ? date(n.date) : '',
      amount: n.amount !== undefined ? money(n.amount) : '',
    });
  }

  function open(n: AppNotification) {
    setRead((s) => new Set(s).add(n.id));
    router.push(n.href);
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger aria-label={t('title')} className={iconBtn}>
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="bg-danger absolute -end-1 -top-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-bold text-white tabular-nums">
            {unread > 9 ? '9+' : num(unread)}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="border-line bg-surface text-ink rounded-card shadow-float w-[min(24rem,calc(100vw-2rem))] overflow-hidden border p-0"
      >
        <div className="border-line bg-canvas/60 flex items-center justify-between gap-3 border-b px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="bg-brand-soft text-brand flex size-9 shrink-0 items-center justify-center rounded-xl">
              <BellRing className="size-4" />
            </span>
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="text-ink text-sm font-extrabold">{t('title')}</h3>
              {unread > 0 && (
                <span className="bg-brand-soft text-brand-deep rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums">
                  {num(unread)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            disabled={unread === 0}
            onClick={() => setRead(new Set(all.map((n) => n.id)))}
            className="text-brand-deep hover:bg-brand-soft rounded-btn shrink-0 px-2.5 py-2 text-[11px] font-bold transition-colors disabled:pointer-events-none disabled:opacity-40"
          >
            {t('markAll')}
          </button>
        </div>

        {all.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-10 text-center">
            <span className="bg-neutral-soft text-muted flex size-12 items-center justify-center rounded-full">
              <Bell className="size-5" />
            </span>
            <p className="text-ink mt-3 text-sm font-bold">{t('empty')}</p>
          </div>
        ) : (
          <ul className="divide-line/70 max-h-[min(24rem,calc(100dvh-8rem))] divide-y overflow-y-auto p-1.5">
            {all.map((n) => {
              const { Icon, tone } = ICON[n.kind];
              const isRead = read.has(n.id);
              return (
                <li key={n.id}>
                  <DropdownMenuItem
                    onClick={() => open(n)}
                    className={cn(
                      'rounded-btn data-highlighted:bg-canvas items-start gap-3 px-3 py-3 transition-colors',
                      !isRead && 'bg-brand-soft/40',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-xl',
                        tone,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'text-ink block text-xs leading-5',
                          isRead ? 'font-semibold' : 'font-extrabold',
                        )}
                      >
                        {t(`items.${n.kind}.title`, { title: n.title })}
                      </span>
                      <span className="text-muted block text-[11px]">
                        {hint(n)}
                      </span>
                    </span>
                    {!isRead && (
                      <span className="bg-brand mt-1.5 size-2 shrink-0 rounded-full" />
                    )}
                  </DropdownMenuItem>
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
