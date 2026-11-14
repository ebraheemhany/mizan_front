'use client';

import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getPasswordStrength } from '@/lib/validations/loginForm';

const STRENGTH_STYLE = {
  1: { key: 'weak', bar: 'bg-danger', text: 'text-danger' },
  2: { key: 'fair', bar: 'bg-amber-500', text: 'text-amber-700' },
  3: { key: 'good', bar: 'bg-brand/70', text: 'text-brand-deep' },
  4: { key: 'strong', bar: 'bg-brand', text: 'text-brand-deep' },
} as const;

type Props = {
  id: string;
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
  autoComplete?: string;
  strengthPassword?: string;
};

export default function PasswordField({
  id,
  label,
  error,
  registration,
  autoComplete = 'new-password',
  strengthPassword,
}: Props) {
  const t = useTranslations('Auth.register');
  const [show, setShow] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div>
      <Label htmlFor={id} className="text-ink mb-2 text-sm font-bold">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="h-12 rounded-btn border-line-strong bg-surface pe-11 shadow-sm transition focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/10"
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShow((visible) => !visible)}
          aria-label={show ? t('hidePassword') : t('showPassword')}
          className="text-muted hover:text-ink absolute end-3 top-1/2 -translate-y-1/2"
        >
          {show ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {strengthPassword !== undefined && (
        <PasswordStrength password={strengthPassword} />
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-danger mt-1.5 text-xs font-semibold"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const t = useTranslations('Auth.register.strength');
  const score = getPasswordStrength(password);
  if (score === 0) return null;

  const style = STRENGTH_STYLE[score];

  return (
    <div className="mt-2.5 flex items-center gap-3">
      <div className="flex flex-1 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              level <= score ? style.bar : 'bg-line',
            )}
          />
        ))}
      </div>
      <span className={cn('text-xs font-bold', style.text)}>
        {t(style.key)}
      </span>
    </div>
  );
}
