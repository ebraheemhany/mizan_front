import { useLocale, useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function PricingCard() {
  const locale = useLocale();
  const t = useTranslations('PricingPlan');
  const isArabic = locale === 'ar';

  const features = [t('feature1'), t('feature2'), t('feature3'), t('feature4')];

  const standardFeatures = [
    t('proFeature1'),
    t('proFeature2'),
    t('proFeature3'),
    t('proFeature4'),
  ];

  const starterFeatures = [
    t('freeFeature1'),
    t('freeFeature2'),
    t('freeFeature3'),
    t('freeFeature4'),
  ];

  return (
    <section
      id="pricing"
      className="mx-auto my-12 max-w-[1200px] scroll-mt-24 px-4 sm:px-6 lg:px-8"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div data-reveal="wipe" className="mb-10 text-center">
        <p className="mb-4 text-sm font-bold text-[#00704a] sm:text-base">
          {t('label')}
        </p>
        <h2 className="text-3xl font-black tracking-tight text-[#0b251d] sm:text-4xl md:text-5xl">
          {t('heading')}
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article
          data-reveal="rise"
          dir={isArabic ? 'rtl' : 'ltr'}
          className="flex flex-col rounded-[28px] border-2 border-[#0a7b5a] bg-[#0a7b5a] p-5 text-white shadow-[0_20px_50px_rgba(10,123,90,0.18)] sm:p-6"
        >
          <div className="mb-6 flex justify-center">
            <span className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white">
              {t('popular')}
            </span>
          </div>

          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="text-right">
              <p className="text-lg font-bold">{t('professional')}</p>
            </div>
            <div className="flex items-end gap-2 text-right">
              <span className="text-5xl leading-none font-black">
                {t('professionalPrice')}
              </span>
              <span className="pb-1 text-sm text-emerald-100">
                {t('professionalPeriod')}
              </span>
            </div>
          </div>

          <p className="mb-6 text-center text-sm text-emerald-50">
            {t('professionalDescription')}
          </p>

          <ul className="space-y-3 pb-6" dir={isArabic ? 'rtl' : 'ltr'}>
            {standardFeatures.map((feature, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-3 text-sm text-emerald-50"
              >
                <span className={isArabic ? 'text-right' : 'text-left'}>
                  {feature}
                </span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                  <Check className="h-4 w-4" />
                </span>
              </li>
            ))}
          </ul>

          <Link
            href="/register"
            className="mt-auto block w-full text-center rounded-xl bg-white px-4 py-3.5 text-base font-bold text-[#0a7b5a] shadow-sm transition hover:bg-emerald-50"
          >
            {t('professionalButton')}
          </Link>
        </article>

        <article
          data-reveal="rise"
          dir={isArabic ? 'rtl' : 'ltr'}
          className="flex flex-col rounded-[28px] border border-[#dfe9e5] bg-white p-5 text-[#0b251d] shadow-[0_16px_40px_rgba(35,55,45,0.06)] sm:p-6"
        >
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="text-right">
              <p className="text-lg font-bold">{t('free')}</p>
            </div>
            <div className="flex items-end gap-2 text-right">
              <span className="text-5xl leading-none font-black">
                {t('freePrice')}
              </span>
              <span className="pb-1 text-sm text-gray-500">
                {t('freePeriod')}
              </span>
            </div>
          </div>

          <p className="mb-6 text-center text-sm text-gray-500">
            {t('freeDescription')}
          </p>

          <ul className="space-y-3 pb-6" dir={isArabic ? 'rtl' : 'ltr'}>
            {starterFeatures.map((feature, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-3 text-sm text-gray-700"
              >
                <span className={isArabic ? 'text-right' : 'text-left'}>
                  {feature}
                </span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f7f1] text-[#00704a]">
                  <Check className="h-4 w-4" />
                </span>
              </li>
            ))}
          </ul>

          <Link
            href="/register"
            className="mt-auto block w-full text-center rounded-xl border border-[#dfe9e5] bg-[#f6f9f7] px-4 py-3.5 text-base font-bold text-[#0b251d] transition hover:bg-[#edf5f1]"
          >
            {t('freeButton')}
          </Link>
        </article>
      </div>

      <div data-reveal="rise" className="relative mt-8 overflow-hidden rounded-[28px] border border-emerald-100/60 bg-white px-6 py-10 shadow-[0_18px_50px_rgba(30,80,60,0.08)] sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,131,99,0.08),_transparent_45%)]" />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#00704a] ltr:tracking-[0.12em] ltr:uppercase">
              <span className="inline-block h-2 w-2 rounded-full bg-[#00704a]" />
              {t('title')}
            </div>

            <div className="mb-4 flex items-end gap-3">
              <span className="text-4xl font-black tracking-tight text-[#0b251d] sm:text-5xl">
                {t('price')}
              </span>
              <span className="pb-1 text-sm font-medium text-gray-500">
                {t('period')}
              </span>
            </div>

            <p className="max-w-xl text-sm text-gray-600 sm:text-base">
              {t('description')}
            </p>
          </div>

          <div className="flex-1 rounded-[24px] border border-emerald-100 bg-[#f7fbf9] p-5 sm:p-6">
            <ul className="space-y-3" dir={isArabic ? 'rtl' : 'ltr'}>
              {features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-3 text-sm text-gray-700 sm:text-base"
                >
                  <span className={isArabic ? 'text-right' : 'text-left'}>
                    {feature}
                  </span>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f7f1] text-[#00704a]">
                    <Check className="h-4 w-4" />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative z-10 mt-8 flex justify-center lg:justify-end">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-[#00704a] px-8 py-3.5 text-base font-bold text-white shadow-md transition-all duration-200 hover:bg-[#005739] hover:shadow-lg active:scale-95"
          >
            {t('buttonText')}
          </Link>
        </div>
      </div>
    </section>
  );
}
