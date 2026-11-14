import { useLocale, useTranslations } from 'next-intl';
import {
  Users,
  FileText,
  BarChart3,
  Presentation,
  Receipt,
  CreditCard,
} from 'lucide-react';

export default function FeaturesSection() {
  const locale = useLocale();
  const isArabic = locale === 'ar';
  const t = useTranslations('Features');

  const features = [
    {
      icon: Users,
      title: t('card1Title'),
      description: t('card1Desc'),
    },
    {
      icon: FileText,
      title: t('card2Title'),
      description: t('card2Desc'),
    },
    {
      icon: CreditCard,
      title: t('card3Title'),
      description: t('card3Desc'),
    },
    {
      icon: Receipt,
      title: t('card4Title'),
      description: t('card4Desc'),
    },
    {
      icon: Presentation,
      title: t('card5Title'),
      description: t('card5Desc'),
    },
    {
      icon: BarChart3,
      title: t('card6Title'),
      description: t('card6Desc'),
    },
  ];

  return (
    <section
      id="features"
      className="my-12 scroll-mt-24 bg-[#edf5f1] py-16 sm:py-20"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <span className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#00704a]">
            <span className="h-2 w-2 rounded-full bg-[#00704a] ring-4 ring-[#00704a]/10" />
            {t('sectionSubtitle')}
          </span>
          <h2 className="mx-auto max-w-2xl text-3xl leading-tight font-black text-[#0b251d] sm:text-4xl md:text-5xl">
            {t('sectionTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-card flex items-start gap-4 border border-[#dfe9e5] bg-white p-5 shadow-[0_8px_24px_rgba(11,37,29,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#9dd4bd] hover:shadow-[0_16px_35px_rgba(11,37,29,0.08)] sm:p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#e8f7f1] text-[#00704a] transition-colors group-hover:bg-[#d8f0e5]">
                  <Icon className="h-6 w-6" strokeWidth={1.7} />
                </div>

                <div className="min-w-0 text-start">
                  <h3 className="mb-2 text-lg font-bold text-[#0b251d] sm:text-xl">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-7 text-[#52665d] sm:text-base">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
