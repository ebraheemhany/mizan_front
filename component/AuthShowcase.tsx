// src/components/auth/AuthShowcase.tsx
import Image from 'next/image';
import { Bell, Check, Kanban } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

export default function AuthShowcase() {
  const t = useTranslations('Auth.showcase');
  const format = useFormatter();

  return (
    <aside className="text-brand-mint relative isolate hidden flex-col overflow-hidden p-12 lg:flex xl:p-16">
      {/* الصورة + الـ overlay */}
      <Image
        src="/image/using_image.jfif"
        alt=""
        fill
        priority
        sizes="50vw"
        className="-z-20 object-cover"
      />
      <div className="from-brand-dark/85 via-brand-dark/55 to-brand-dark/80 absolute inset-0 -z-10 bg-linear-to-b" />

      <h2 className="max-w-xl text-4xl leading-normal font-extrabold text-balance text-white xl:text-5xl">
        {t('title')}
      </h2>
      <p className="mt-5 max-w-sm text-base leading-8">{t('subtitle')}</p>

      <div className="mt-auto space-y-3 pt-12">
        {/* تحصيل فاتورة */}
        <div className="text-ink bg-surface shadow-float flex items-center justify-between gap-4 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span className="bg-brand-soft text-brand flex size-10 shrink-0 items-center justify-center rounded-xl">
              <Check className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold">{t('paid.title')}</p>
              <p className="text-muted text-xs">{t('paid.subtitle')}</p>
            </div>
          </div>
          <p className="text-brand text-sm font-extrabold tabular-nums">
            {format.number(12400, { numberingSystem: 'latn' })} {t('currency')}
          </p>
        </div>

        {/* صفقة */}
        <div className="bg-brand-panel/70 border-brand-panel-line/60 flex items-center gap-3 rounded-2xl border p-4 text-white lg:me-6">
          <span className="bg-brand-dark/60 flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Kanban className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold">{t('deal.title')}</p>
            <p className="text-brand-mint text-xs">{t('deal.subtitle')}</p>
          </div>
        </div>

        {/* تذكير */}
        <div className="bg-brand-panel/50 border-brand-panel-line/40 flex items-center gap-3 rounded-2xl border p-4 text-white">
          <span className="bg-brand-dark/60 flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Bell className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold">{t('reminder.title')}</p>
            <p className="text-brand-mint text-xs">{t('reminder.subtitle')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
