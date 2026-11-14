// component/dashbord/TopBar.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

import NotificationsMenu from './notifications/NotificationsMenu';
import CommandSearch from './search/CommandSearch';
import UserMenu from './UserMenu';

export default function TopBar() {
  const t = useTranslations('TopBar');
  const [searchOpen, setSearchOpen] = useState(false);

  // Capture the shortcut before the browser handles its own key bindings.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.code === 'KeyK'
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, []);

  return (
    <>
      <header className="border-line bg-surface sticky top-0 z-30 hidden h-16 items-center gap-4 border-b px-8 lg:flex">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="border-line bg-canvas text-muted hover:border-line-strong focus-visible:ring-brand/30 rounded-btn flex h-10 w-full max-w-xl items-center gap-2 border px-3 text-start text-xs transition-colors outline-none focus-visible:ring-2"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 truncate">{t('search')}</span>
          <kbd
            dir="ltr"
            className="border-line bg-surface text-ink-2 rounded-md border px-1.5 py-0.5 text-[10px] font-bold"
          >
            Ctrl + Shift + K
          </kbd>
        </button>

        <div className="ms-auto flex items-center gap-3">
          <NotificationsMenu />
          <UserMenu />
        </div>
      </header>

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}