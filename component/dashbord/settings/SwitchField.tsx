// component/dashbord/settings/SwitchField.tsx
'use client';

import { useId, type ReactNode } from 'react';
import { Controller, useFormContext, type FieldPath } from 'react-hook-form';

import { cn } from '@/lib/utils';
import type { SettingsValues } from '@/lib/validations/settings';
import SwitchControl from './SwitchControl';

export default function SwitchField({
  name,
  label,
  hint,
  badge,
  disabled,
}: {
  name: FieldPath<SettingsValues>;
  label: string;
  hint?: string;
  badge?: ReactNode;
  disabled?: boolean;
}) {
  const { control } = useFormContext<SettingsValues>();
  const id = useId();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div
          className={cn(
            'flex items-center justify-between gap-4',
            disabled && 'opacity-60',
          )}
        >
          <div className="min-w-0">
            <p id={id} className="text-ink text-xs font-bold">
              {label}
            </p>
            {(hint || badge) && (
              <p className="text-muted mt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
                {badge}
                {hint}
              </p>
            )}
          </div>

          <SwitchControl
            checked={Boolean(field.value)}
            onChange={field.onChange}
            labelledBy={id}
            disabled={disabled}
          />
        </div>
      )}
    />
  );
}
