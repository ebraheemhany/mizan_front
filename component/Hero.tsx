// src/components/landing/Hero.tsx
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import DashboardPreview from './DashboardPreview';

export default function Hero() {
  const t = useTranslations('Hero');

  const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

  return (
    <section className="flex flex-col items-center px-5 pt-10 text-center sm:pt-14">
      <span
        className="animate-fade-up bg-brand-soft text-brand-deep rounded-full px-3.5 py-1 text-xs font-bold motion-reduce:animate-none"
        style={delay(0)}
      >
        {t('badge')}
      </span>

      <h1
        className="animate-fade-up text-ink mt-4 max-w-4xl text-3xl leading-[1.5] font-extrabold text-balance motion-reduce:animate-none sm:text-4xl lg:text-5xl"
        style={delay(100)}
      >
        {t('title')}
      </h1>

      <p
        className="animate-fade-up text-body mt-4 max-w-xl text-sm leading-7 text-pretty motion-reduce:animate-none sm:text-base"
        style={delay(200)}
      >
        {t('description')}
      </p>

      <div
        className="animate-fade-up mt-6 flex flex-wrap items-center justify-center gap-3 motion-reduce:animate-none"
        style={delay(300)}
      >
        <Link
          href="/register"
          className="rounded-btn bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
        >
          {t('primaryCta')}
        </Link>
        <Link
          href="/dashboard"
          className="rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas border px-5 py-2.5 text-sm font-bold transition"
        >
          {t('secondaryCta')}
        </Link>
      </div>

      <p
        className="animate-fade-up text-muted mt-3 text-xs motion-reduce:animate-none"
        style={delay(400)}
      >
        {t('note')}
      </p>

      {/* الـ preview بيتقص عند نهاية السكشن */}
      <div className="mt-8 flex w-full justify-center overflow-hidden">
        <DashboardPreview />
      </div>
    </section>
  );
}
