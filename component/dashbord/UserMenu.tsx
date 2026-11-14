// component/dashbord/UserMenu.tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, Languages, LogOut, Settings } from 'lucide-react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from '@/i18n/navigation';
import { mockUser } from '@/lib/mock/user';

export default function UserMenu() {
  const t = useTranslations('UserMenu');
  const tTop = useTranslations('TopBar');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const initial = Array.from(mockUser.name)[0];
  const nextLocale = locale === 'ar' ? 'en' : 'ar';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={t('title')}
        className="border-line-strong bg-surface hover:border-brand-mint hover:bg-canvas data-[popup-open]:border-brand-mint data-[popup-open]:bg-brand-soft/50 focus-visible:ring-brand/30 rounded-btn flex items-center gap-2.5 border px-2.5 py-1.5 text-start transition-colors outline-none focus-visible:ring-2"
      >
        <span className="min-w-0 text-end">
          <span className="text-ink block max-w-36 truncate text-xs leading-4 font-extrabold">
            {mockUser.name}
          </span>
          <span className="text-muted mt-0.5 block text-[10px] leading-4 font-semibold">
            {tTop(`roles.${mockUser.role}`)}
          </span>
        </span>
        <span
          aria-hidden
          className="bg-brand-dark ring-surface flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white shadow-sm ring-2"
        >
          {initial}
        </span>
        <ChevronDown className="text-muted size-3.5 shrink-0 transition-transform data-[popup-open]:rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="border-line bg-surface text-ink shadow-float rounded-card min-w-64 p-1.5"
      >
        <div className="bg-canvas/60 flex items-center gap-3 rounded-xl px-3 py-3">
          <span
            aria-hidden
            className="bg-brand-dark flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
          >
            {initial}
          </span>
          <div className="min-w-0">
            <p className="text-ink truncate text-xs font-extrabold">
              {mockUser.name}
            </p>
            <p className="text-muted mt-0.5 truncate text-[11px] font-medium">
              {tTop(`roles.${mockUser.role}`)}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator className="my-1.5" />

        <DropdownMenuItem
          onClick={() => router.replace(pathname, { locale: nextLocale })}
          className="text-ink rounded-btn focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep min-h-10 cursor-pointer px-3 py-2 text-xs font-semibold transition-colors"
        >
          <Languages className="text-muted size-4" />
          {t(`switchTo.${nextLocale}`)}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push('/settings')}
          className="gap-2 text-xs font-semibold"
        >
          <Settings className="size-4" />
          {t('settings')}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1.5" />

        {/* TODO: تسجيل خروج حقيقي لما نعمل الـ auth */}
        <DropdownMenuItem
          onClick={() => toast.info(t('toasts.soon'))}
          className="text-danger focus:bg-danger-soft focus:text-danger data-highlighted:bg-danger-soft data-highlighted:text-danger rounded-btn min-h-10 cursor-pointer px-3 py-2 text-xs font-semibold transition-colors"
        >
          <LogOut className="size-4 rtl:rotate-180" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
