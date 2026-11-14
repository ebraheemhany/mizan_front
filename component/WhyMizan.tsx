import { useLocale, useTranslations } from 'next-intl';
import { Clock, MessageSquare, TableProperties } from 'lucide-react';

export default function WhyMizan() {
  const locale = useLocale();
  const isArabic = locale === 'ar';
  const t = useTranslations('WhyMizan');

  const problems = [
    {
      icon: Clock,
      title: t('problem1Title'),
      description: t('problem1Desc'),
    },
    {
      icon: MessageSquare,
      title: t('problem2Title'),
      description: t('problem2Desc'),
    },
    {
      icon: TableProperties,
      title: t('problem3Title'),
      description: t('problem3Desc'),
    },
  ];

  return (
    <section
      className="my-12 bg-white py-16 sm:py-20"
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5">
          {problems.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="group rounded-card flex min-h-56 flex-col border border-[#dfe9e5] bg-white p-6 shadow-[0_8px_24px_rgba(11,37,29,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#9dd4bd] hover:shadow-[0_16px_35px_rgba(11,37,29,0.08)] sm:p-7"
              >
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#e8f7f1] text-[#00704a] transition-colors group-hover:bg-[#00704a] group-hover:text-white">
                    <Icon className="h-6 w-6" strokeWidth={1.7} />
                  </div>
                  <span
                    className="text-sm font-bold text-[#8ba99a]"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="mb-3 text-start text-xl font-bold text-[#0b251d] sm:text-2xl">
                  {item.title}
                </h3>
                <p className="text-start text-sm leading-7 text-[#52665d] sm:text-base">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
