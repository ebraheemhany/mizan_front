// components/customers/CustomerAvatar.tsx
import { cn } from '@/lib/utils';

const STYLES = [
  'bg-brand-soft text-brand-deep',
  'bg-amber-100 text-amber-800',
  'bg-info-soft text-info',
  'bg-danger-soft text-danger',
];

function styleFor(id: string) {
  const sum = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return STYLES[sum % STYLES.length];
}

// الحرف الأول من آخر كلمة في الاسم بعد حذف "ال" ("شركة النيل" ← ن)
function initial(name: string) {
  const words = name.trim().split(/\s+/);
  const last = words[words.length - 1].replace(/^ال/, '');
  return last.charAt(0) || name.charAt(0);
}

export default function CustomerAvatar({
  id,
  name,
  className,
}: {
  id: string;
  name: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold',
        styleFor(id),
        className,
      )}
    >
      {initial(name)}
    </span>
  );
}