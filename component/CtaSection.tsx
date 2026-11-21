import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function CtaSection() {
  const t = useTranslations('CTA');

  return (
    <section className="mx-auto my-12 max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* تم إضافة min-h-[350px] أو ارتفاع مناسب لضمان ظهور الصورة بالكامل */}
      <div data-reveal="rise" className="relative flex min-h-[350px] w-full items-center justify-center overflow-hidden rounded-3xl border border-emerald-100/50 px-6 py-16 text-center shadow-sm sm:px-12">
        {/* صورة الخلفية */}
        <div
          data-reveal="zoom"
          className="absolute inset-0 h-full w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/image/cat_image.jfif')` }}
        />

        {/* طبقة التراكب (Overlay) باللون الأخضر الفاتح الشفاف */}
        <div className="absolute inset-0 bg-[#ebf7f3]/70 backdrop-blur-[2px]" />

        {/* المحتوى الداخلي */}
        <div className="relative z-10 mx-auto max-w-3xl space-y-6">
          <h2 className="text-2xl leading-snug font-extrabold text-[#0b251d] sm:text-3xl md:text-4xl">
            {t('title')}
          </h2>

          <p className="mx-auto max-w-xl text-sm font-medium text-[#3b5e53] sm:text-base md:text-lg">
            {t('subtitle')}
          </p>

          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex transform items-center justify-center rounded-xl bg-[#00704a] px-8 py-3.5 text-base font-bold text-white shadow-md transition-all duration-200 hover:bg-[#005739] hover:shadow-lg active:scale-95"
            >
              {t('buttonText')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
