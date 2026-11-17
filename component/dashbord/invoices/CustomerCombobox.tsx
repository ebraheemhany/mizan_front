// components/invoices/CustomerCombobox.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { Check, ChevronDown, UserRoundPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type CustomerOption = { id: string; name: string; city: string };

export default function CustomerCombobox({
  id,
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  addCustomerText,
  addCustomerDescription,
  customerNameLabel,
  customerNamePlaceholder,
  customerCityLabel,
  customerCityPlaceholder,
  customerNameRequired,
  createCustomerText,
  cancelText,
  invalid,
  onChange,
  onAddCustomer,
}: {
  id?: string;
  value: string;
  options: CustomerOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  addCustomerText: string;
  addCustomerDescription: string;
  customerNameLabel: string;
  customerNamePlaceholder: string;
  customerCityLabel: string;
  customerCityPlaceholder: string;
  customerNameRequired: string;
  createCustomerText: string;
  cancelText: string;
  invalid?: boolean;
  onChange: (id: string) => void;
  /**
   * Creates the customer and returns its id (or null if it failed, e.g. the
   * user may not add customers; the caller shows the error). May be async.
   */
  onAddCustomer: (customer: { name: string; city: string }) => string | null | Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [nameError, setNameError] = useState('');
  const current = options.find((o) => o.id === value);

  async function addCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // This form sits inside the invoice form in the React tree; keep the submit here.
    event.stopPropagation();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(customerNameRequired);
      return;
    }

    const id = await onAddCustomer({ name: trimmedName, city: city.trim() });
    if (!id) return;
    onChange(id);
    setName('');
    setCity('');
    setNameError('');
    setAddingCustomer(false);
    setOpen(false);
  }

  function closePopover(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setAddingCustomer(false);
      setName('');
      setCity('');
      setNameError('');
    }
  }

  return (
    <Popover open={open} onOpenChange={closePopover}>
      <PopoverTrigger
        id={id}
        aria-invalid={invalid}
        className={cn(
          'rounded-btn bg-surface flex h-11 w-full items-center gap-3 border px-3 text-start text-sm transition-colors outline-none focus-visible:ring-2',
          invalid
            ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/15'
            : 'border-line-strong hover:border-brand/50 hover:bg-canvas focus-visible:border-brand focus-visible:ring-brand/15',
        )}
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            current ? 'text-ink font-semibold' : 'text-muted',
          )}
        >
          {current ? current.name : placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="border-line w-[min(24rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-xl border bg-surface p-0 shadow-lg"
      >
        <Command className="rounded-xl bg-surface p-1.5">
          {addingCustomer ? (
            <form onSubmit={addCustomer} className="space-y-3 p-2">
              <div className="flex items-center gap-2 pb-1">
                <UserRoundPlus className="text-brand size-4" />
                <h3 className="text-ink text-sm font-bold">
                  {addCustomerText}
                </h3>
              </div>
              <label className="text-ink-2 block text-xs font-semibold">
                {customerNameLabel}
                <Input
                  autoFocus
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (event.target.value.trim()) setNameError('');
                  }}
                  placeholder={customerNamePlaceholder}
                  aria-invalid={!!nameError}
                  className="rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 mt-1.5 h-10 text-sm"
                />
              </label>
              {nameError && (
                <p role="alert" className="text-danger text-xs font-semibold">
                  {nameError}
                </p>
              )}
              <label className="text-ink-2 block text-xs font-semibold">
                {customerCityLabel}
                <Input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder={customerCityPlaceholder}
                  className="rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 mt-1.5 h-10 text-sm"
                />
              </label>
              <p className="text-muted text-xs leading-5">
                {addCustomerDescription}
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddingCustomer(false);
                    setName('');
                    setCity('');
                    setNameError('');
                  }}
                  className="rounded-btn border-line-strong h-9 px-3 text-xs"
                >
                  {cancelText}
                </Button>
                <Button
                  type="submit"
                  className="rounded-btn bg-brand hover:bg-brand/90 h-9 px-3 text-xs font-bold text-white"
                >
                  {createCustomerText}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <CommandInput
                placeholder={searchPlaceholder}
                className="text-ink placeholder:text-muted"
              />
              <CommandList className="max-h-64 py-1">
                <CommandEmpty className="text-muted py-5">
                  {emptyText}
                </CommandEmpty>
                <CommandGroup>
                  {options.map((o) => (
                    <CommandItem
                      key={o.id}
                      value={`${o.name} ${o.city}`}
                      className="data-selected:bg-brand-soft data-selected:text-brand-deep rounded-lg px-3 py-2.5"
                      onSelect={() => {
                        onChange(o.id);
                        setOpen(false);
                      }}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">
                          {o.name}
                        </span>
                        {o.city && (
                          <span className="text-muted block text-xs">
                            {o.city}
                          </span>
                        )}
                      </span>
                      <Check
                        className={cn(
                          'text-brand size-4',
                          o.id === value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
              <div className="border-line border-t px-2 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAddingCustomer(true)}
                  className="text-brand hover:bg-brand-soft hover:text-brand-deep h-auto w-full justify-start gap-2 rounded-lg px-2 py-2 text-sm font-bold"
                >
                  <UserRoundPlus className="size-4" />
                  {addCustomerText}
                </Button>
              </div>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
