// src/components/common/Logo.tsx
import { Scale } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Logo({ href = '/' }: { href?: string }) {
  const t = useTranslations('Header');

  return (
    <Link href={href} className="inline-flex items-center gap-2.5">
      <span className="bg-brand flex size-9 items-center justify-center rounded-[11px] text-white">
        <Scale className="size-5" />
      </span>
      <span className="text-ink text-xl font-extrabold">{t('logo')}</span>
    </Link>
  );
}
