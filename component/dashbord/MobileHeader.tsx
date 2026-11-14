// components/app/MobileHeader.tsx
'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { rtlLocales } from '@/i18n/routing';
import SidebarNav from './SidebarNav';
import Logo from '../Logo';

export default function MobileHeader() {
  const t = useTranslations('Nav');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-line bg-surface sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 lg:hidden">
      <Logo href="/dashboard" />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label={t('openMenu')}
          className="text-ink hover:bg-canvas focus-visible:ring-brand inline-flex size-8 items-center justify-center rounded-lg outline-none focus-visible:ring-2"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent
          side={rtlLocales.includes(locale) ? 'right' : 'left'}
          className="border-line bg-surface text-ink w-72 gap-0 overflow-x-hidden overflow-y-auto overscroll-contain border-e p-0 py-5 [scrollbar-color:var(--color-line-strong)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-line-strong [&::-webkit-scrollbar-thumb:hover]:bg-brand"
        >
          <SheetTitle className="sr-only">{t('menuTitle')}</SheetTitle>
          <div className="border-line mb-5 border-b px-6 pb-5">
            <Logo href="/dashboard" />
          </div>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}