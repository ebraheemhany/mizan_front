import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

type FooterLink = {
  label:
    | 'features'
    | 'pricing'
    | 'freeTrial'
    | 'faq'
    | 'contactUs'
    | 'privacyPolicy'
    | 'terms';
  href?: string;
};

const columns: {
  title: 'productTitle' | 'companyTitle' | 'legalTitle';
  links: FooterLink[];
}[] = [
  {
    title: 'productTitle',
    links: [
      { label: 'features', href: '/#features' },
      { label: 'pricing', href: '/#pricing' },
      { label: 'freeTrial', href: '/register' },
    ],
  },
  {
    title: 'companyTitle',
    links: [{ label: 'faq', href: '/#faq' }, { label: 'contactUs' }],
  },
  {
    title: 'legalTitle',
    links: [{ label: 'privacyPolicy' }, { label: 'terms' }],
  },
];

export default function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="bg-[#0b251d] px-4 pt-16 pb-8 font-sans text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* الجزء العلوي */}
        <div className="flex flex-col items-start justify-between gap-10 pb-12 md:flex-row">
          {/* الشعار والوصف */}
          <div className="max-w-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl font-bold tracking-tight">
                {t('brandName')}
              </span>
              <span className="inline-block h-6 w-6 rounded-md bg-[#00a86b]"></span>
            </div>
            <p className="text-sm leading-relaxed text-[#a3b8b0] sm:text-base">
              {t('description')}
            </p>
          </div>

          {/* مجموعات الروابط */}
          <div className="flex w-full flex-wrap gap-12 sm:gap-16 md:w-auto">
            {columns.map((col) => (
              <div key={col.title} className="min-w-[120px]">
                <h4 className="mb-4 text-base font-bold text-white">
                  {t(col.title)}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.href ? (
                        <Link
                          href={link.href}
                          className="text-sm text-[#a3b8b0] transition-colors duration-200 hover:text-white"
                        >
                          {t(link.label)}
                        </Link>
                      ) : (
                        // TODO: الصفحات دي لسه مش موجودة، تتحول لينك لما تتعمل
                        <span className="text-sm text-[#a3b8b0]/60">
                          {t(link.label)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* خط الفاصل وحقوق النشر */}
        <div className="border-t border-white/10 pt-6 text-center text-sm text-[#a3b8b0]">
          <p>{t('rights')}</p>
        </div>
      </div>
    </footer>
  );
}
