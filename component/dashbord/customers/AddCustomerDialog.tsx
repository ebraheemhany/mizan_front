'use client';

import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { OWNERS, type Customer } from '@/lib/mock/customers';

type NewCustomer = Pick<
  Customer,
  'name' | 'city' | 'contact' | 'phone' | 'email' | 'ownerId'
>;

const EMPTY_CUSTOMER: NewCustomer = {
  name: '',
  city: '',
  contact: '',
  phone: '',
  email: '',
  ownerId: OWNERS[0].id,
};

export default function AddCustomerDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (customer: NewCustomer) => void;
}) {
  const t = useTranslations('Customers');
  const [customer, setCustomer] = useState<NewCustomer>(EMPTY_CUSTOMER);

  const update = (field: keyof NewCustomer, value: string) => {
    setCustomer((current) => ({ ...current, [field]: value }));
  };

  const close = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) setCustomer(EMPTY_CUSTOMER);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(customer);
    close(false);
  };

  const inputClass =
    'border-line-strong bg-surface text-ink h-10 rounded-btn px-3 text-sm';
  const labelClass = 'text-ink-2 text-xs font-bold';

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="rounded-card border-line bg-surface text-ink shadow-float gap-0 overflow-hidden border p-0 sm:max-w-lg">
        <DialogHeader className="border-line bg-canvas/60 gap-1 border-b px-6 py-5 text-start">
          <DialogTitle className="text-ink text-lg font-extrabold">
            {t('form.title')}
          </DialogTitle>
          <DialogDescription className="text-muted text-sm">
            {t('form.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className={labelClass}>{t('columns.name')}</span>
              <Input
                autoFocus
                required
                value={customer.name}
                onChange={(event) => update('name', event.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className={labelClass}>{t('columns.contact')}</span>
              <Input
                required
                value={customer.contact}
                onChange={(event) => update('contact', event.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className={labelClass}>{t('columns.phone')}</span>
              <Input
                required
                type="tel"
                value={customer.phone}
                onChange={(event) => update('phone', event.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className={labelClass}>{t('columns.email')}</span>
              <Input
                required
                type="email"
                value={customer.email}
                onChange={(event) => update('email', event.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className={labelClass}>{t('columns.city')}</span>
              <Input
                required
                value={customer.city}
                onChange={(event) => update('city', event.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className={labelClass}>{t('columns.owner')}</span>
              <select
                required
                value={customer.ownerId}
                onChange={(event) => update('ownerId', event.target.value)}
                className={`${inputClass} w-full`}
              >
                {OWNERS.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <DialogFooter className="border-line bg-canvas/60 flex-row justify-end gap-2 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => close(false)}
              className="rounded-btn border-line-strong bg-surface h-10 px-5 text-xs font-bold"
            >
              {t('form.cancel')}
            </Button>
            <Button
              type="submit"
              className="rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 px-5 text-xs font-bold text-white"
            >
              <Plus className="size-4" />
              {t('form.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
