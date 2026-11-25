'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';

import { Scale, Languages, ChevronDown, Check, Menu, X } from 'lucide-react';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LANGUAGES = [
  { code: 'ar', label: 'العربية', short: 'ع' },
  { code: 'en', label: 'English', short: 'EN' },
] as const;

type LocaleCode = (typeof LANGUAGES)[number]['code'];

function LanguageMenu({
  locale,
  label,
  onChange,
  fullWidth = false,
}: {
  locale: string;
  label: string;
  onChange: (locale: LocaleCode) => void;
  fullWidth?: boolean;
}) {
  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        className={cn(
          'group inline-flex h-10 items-center gap-2 rounded-xl border border-[#d5e1da] bg-white px-3 text-sm font-semibold whitespace-nowrap text-[#263c34] transition-colors outline-none hover:border-[#008363]/40 hover:bg-[#f3f8f5] focus-visible:ring-2 focus-visible:ring-[#008363]/30 data-popup-open:border-[#008363]/50 data-popup-open:bg-[#eaf2ed]',
          fullWidth && 'h-11 w-full',
        )}
      >
        <Languages className="size-4 text-[#008363]" />
        {current.label}
        <ChevronDown
          className={cn(
            'size-3.5 text-[#53645d] transition-transform group-data-popup-open:rotate-180',
            fullWidth && 'ms-auto',
          )}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className={cn(
          'rounded-xl border-[#d5e1da] bg-white p-1.5 shadow-lg',
          fullWidth ? 'w-(--anchor-width)' : 'min-w-44',
        )}
      >
        {LANGUAGES.map((lang) => {
          const active = lang.code === locale;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => onChange(lang.code)}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'min-h-10 cursor-pointer gap-2.5 rounded-lg px-2.5 text-sm text-[#263c34] data-highlighted:bg-[#eaf2ed] data-highlighted:text-[#006e53]',
                active && 'font-bold text-[#006e53]',
              )}
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold',
                  active
                    ? 'bg-[#008363] text-white'
                    : 'bg-[#edf3ef] text-[#53645d]',
                )}
              >
                {lang.short}
              </span>
              <span className="flex-1">{lang.label}</span>
              {active && <Check className="size-4 text-[#008363]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Header() {
  const locale = useLocale();
  const t = useTranslations('Header');
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const isArabic = locale === 'ar';

  const navLinks = [
    { label: t('features'), href: '/#features' },
    { label: t('howItWorks'), href: '/#how-it-works' },
    { label: t('pricing'), href: '/#pricing' },
    { label: t('faq'), href: '/#faq' },
  ];

  function changeLanguage(nextLocale: LocaleCode) {
    setOpen(false);

    if (nextLocale !== locale) {
      router.replace(pathname, { locale: nextLocale });
    }
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header
      dir={isArabic ? 'rtl' : 'ltr'}
      className="sticky top-0 z-50 w-full border-b border-[#e9eeeb] bg-[#f8faf8]/95 backdrop-blur"
    >
      <div className="mx-auto flex h-19 max-w-360 items-center justify-between px-4 sm:px-6 lg:px-10">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label={t('logo')}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#008363] text-white">
            <Scale size={22} strokeWidth={2.2} />
          </span>

          <span className="text-2xl font-extrabold tracking-tight text-[#17352d] sm:text-[28px]">
            {t('logo')}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-5 xl:flex 2xl:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium whitespace-nowrap text-[#53645d] transition-colors hover:text-[#008363]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <LanguageMenu
            locale={locale}
            label={t('changeLanguage')}
            onChange={changeLanguage}
          />

          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/login')}
            className="h-10 rounded-xl px-3.5 whitespace-nowrap text-[#263c34]"
          >
            {t('login')}
          </Button>

          <Button
            type="button"
            onClick={() => router.push('/register')}
            className="h-10 rounded-xl bg-[#008363] px-4 font-bold whitespace-nowrap text-white hover:bg-[#006e53]"
          >
            {t('getStarted')}
          </Button>
        </div>

        {/* Mobile & Tablet Menu */}
        <div className="xl:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              type="button"
              aria-label={t('openMenu')}
              className="flex size-13 items-center justify-center rounded-2xl border border-[#d5e1da] bg-white text-[#17352d] hover:bg-[#edf3ef]"
            >
              <Menu className="size-6" />
            </SheetTrigger>

            <SheetContent
              side={isArabic ? 'right' : 'left'}
              dir={isArabic ? 'rtl' : 'ltr'}
              showCloseButton={false}
              className="w-75 max-w-[85vw] border-[#e9eeeb] bg-[#f8faf8] p-5 sm:w-85"
            >
              <SheetHeader className="flex w-full flex-row items-center justify-between gap-3 border-b border-[#e9eeeb] pb-5">
                <SheetTitle className="flex items-center gap-2 text-[#17352d]">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-[#008363] text-white">
                    <Scale size={20} />
                  </span>
                  <span className="text-xl font-extrabold">{t('logo')}</span>
                </SheetTitle>

                <SheetClose
                  className="flex size-9 items-center justify-center rounded-lg text-[#53645d] transition hover:bg-[#edf2ed] hover:text-[#17352d]"
                  aria-label={t('closeMenu')}
                >
                  <X size={18} />
                </SheetClose>
              </SheetHeader>

              <nav className="mt-5 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={closeMenu}
                    className="rounded-xl px-4 py-3.5 text-sm font-medium text-[#53645d] transition hover:bg-[#eaf2ed] hover:text-[#008363]"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-6 flex flex-col gap-3 border-t border-[#e9eeeb] pt-5">
                <LanguageMenu
                  locale={locale}
                  label={t('changeLanguage')}
                  onChange={changeLanguage}
                  fullWidth
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    closeMenu();
                    router.push('/login');
                  }}
                  className="h-11 rounded-xl border-[#d5e1da] bg-white"
                >
                  {t('login')}
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    router.push('/register');
                  }}
                  className="h-11 rounded-xl bg-[#008363] font-bold text-white hover:bg-[#006e53]"
                >
                  {t('getStarted')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
