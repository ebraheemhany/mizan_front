'use client';

import { Select as SelectPrimitive } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  settingsSelectContent,
  settingsSelectItem,
  settingsSelectTrigger,
} from './fieldStyles';

export default function SettingsSelect({
  id,
  value,
  onValueChange,
  options,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <SelectPrimitive.Root
      value={value}
      // Lets the trigger show the label (محاسب, 30 يوم...) before the list has ever been opened.
      items={options}
      onValueChange={(nextValue) => {
        if (typeof nextValue === 'string') onValueChange(nextValue);
      }}
    >
      <SelectPrimitive.Trigger
        id={id}
        dir="ltr"
        className={settingsSelectTrigger}
      >
        <SelectPrimitive.Icon
          className={({ open }) =>
            cn(
              'text-muted size-4 shrink-0 transition-transform',
              open && 'rotate-180',
            )
          }
        >
          <ChevronDown
            aria-hidden
            className="size-4"
          />
        </SelectPrimitive.Icon>
        <SelectPrimitive.Value
          dir="auto"
          className="min-w-0 flex-1 text-end"
        />
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          side="bottom"
          sideOffset={6}
          align="start"
          className="z-50"
        >
          <SelectPrimitive.Popup className={settingsSelectContent}>
            <SelectPrimitive.List>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={cn(settingsSelectItem, 'gap-2')}
                  dir="auto"
                >
                  <SelectPrimitive.ItemText className="min-w-0 flex-1 truncate">
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator>
                    <Check aria-hidden className="text-brand size-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
