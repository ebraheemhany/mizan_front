// src/components/landing/FAQ.tsx
import { useTranslations } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const ITEMS = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;

export default function FAQ() {
  const t = useTranslations('FAQ');

  return (
    <section id="faq" className="my-12 scroll-mt-24 bg-[#edf5f1] px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-220">
        <div data-reveal="wipe" className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <span className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#00704a]">
            <span className="size-2 rounded-full bg-[#00704a] ring-4 ring-[#00704a]/10" />
            {t('eyebrow')}
          </span>
          <h2 className="text-ink text-3xl leading-tight font-black sm:text-4xl">
            {t('title')}
          </h2>
        </div>

        <Accordion defaultValue={['q1']} className="mt-9 gap-3 sm:mt-12">
          {ITEMS.map((key) => (
            <AccordionItem
              key={key}
              value={key}
              data-reveal="rise"
              className="rounded-card border-line bg-surface border px-4 shadow-[0_6px_20px_rgba(11,37,29,0.04)] transition-colors data-open:border-[#9dd4bd] sm:px-6"
            >
              <AccordionTrigger className="text-ink [&_svg]:text-brand min-h-16 py-5 text-start text-base leading-7 font-bold hover:no-underline sm:text-lg">
                {t(`items.${key}.q`)}
              </AccordionTrigger>
              <AccordionContent className="text-body pb-5 text-sm leading-8 sm:pb-6 sm:text-base">
                {t(`items.${key}.a`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
