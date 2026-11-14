// components/auth/RegisterShowcase.tsx
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const STEPS = ['s1', 's2', 's3'] as const;

export default function RegisterShowcase() {
  const t = useTranslations('Auth.registerShowcase');

  return (
    <aside className="text-brand-mint relative isolate hidden flex-col overflow-hidden p-10 lg:flex xl:p-14">
      <Image
        src="/image/using_image.jfif"
        alt=""
        fill
        priority
        sizes="50vw"
        className="-z-20 object-cover"
      />
      <div className="from-brand-dark/85 via-brand-dark/60 to-brand-dark/80 absolute inset-0 -z-10 bg-linear-to-b" />

      <h2 className="max-w-xl text-4xl leading-tight font-extrabold text-balance text-white xl:text-5xl">
        {t('title')}
      </h2>
      <p className="mt-5 max-w-md text-base leading-8 text-white/90">
        {t('subtitle')}
      </p>

      <ol className="mt-auto space-y-3 pt-10">
        {STEPS.map((key, i) => (
          <li
            key={key}
            className="border-brand-panel-line/60 bg-brand-dark/55 flex items-center gap-4 rounded-2xl border p-4 backdrop-blur-sm"
          >
            <span className="border-brand-panel-line bg-brand-panel flex size-11 shrink-0 items-center justify-center rounded-full border text-base font-bold text-white">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-base leading-6 font-bold text-white">
                {t(`steps.${key}.title`)}
              </p>
              <p className="text-brand-mint mt-1 text-sm leading-6">
                {t(`steps.${key}.description`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
