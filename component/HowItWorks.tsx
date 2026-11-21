import { useLocale, useTranslations } from 'next-intl';

export default function HowItWorks() {
  const locale = useLocale();
  const isArabic = locale === 'ar';
  const t = useTranslations('HowItWorks');

  const steps = ([1, 2, 3] as const).map((n) => ({
    number: String(n),
    title: t(`step${n}Title`),
    description: t(`step${n}Desc`),
  }));

  return (
    <section
      id="how-it-works"
      className="relative mx-auto my-12 max-w-7xl scroll-mt-24 overflow-hidden rounded-[32px] px-4 sm:px-6 lg:px-8"
    >
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/image/using_image.jfif')",
          backgroundPosition: isArabic ? 'left center' : 'right center',
          backgroundSize: 'cover',
          filter: 'brightness(0.8) saturate(0.95)',
        }}
      />

      <div className="absolute inset-0 bg-[#0b251d]/65" />

      <div className="relative z-10 px-6 py-20 text-center text-white sm:px-10 lg:px-12">
        <div data-reveal="wipe" className="mb-16">
          <span className="mb-3 block text-sm font-semibold text-emerald-400 ltr:tracking-[0.2em] ltr:uppercase">
            {t('sectionSubtitle')}
          </span>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
            {t('sectionTitle')}
          </h2>
        </div>

        <div
          className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-10"
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          {steps.map((step, index) => (
            <div
              key={index}
              data-reveal="rise"
              className="group relative rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_40px_rgba(5,18,14,0.25)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="mb-6 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-[#00704a] text-lg font-bold text-white shadow-md">
                  {step.number}
                </div>
              </div>

              <div data-reveal="line" className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent" />

              <h3 className="mb-3 text-xl font-bold text-white sm:text-2xl">
                {step.title}
              </h3>

              <p className="mx-auto max-w-xs text-sm leading-relaxed text-[#a3b8b0] sm:text-base">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
