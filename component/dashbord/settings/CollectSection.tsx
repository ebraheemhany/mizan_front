// component/dashbord/settings/CollectSection.tsx
// How the company's customers pay it, shown on every invoice link: the transfer
// details (bank, InstaPay, wallet), and the company's own Paymob account for card
// payments (the money goes straight to the company). Only the owner edits it.
// Rendered inside the settings <form>: no nested forms, every button is type="button".
'use client';

import { useState, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CreditCard, Landmark, Loader2, PlugZap, Unplug } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import {
  useConnectPaymob,
  useDisconnectPaymob,
  usePaymentSetup,
  useSaveTransferDetails,
  type PaymentSetup,
  type PaymobAccountInput,
  type TransferDetails,
} from '@/lib/collections/hooks';
import { useDateTime } from '@/lib/data';
import { useCurrency } from '@/lib/money';
import { cn } from '@/lib/utils';
import { settingsInput, settingsLabel, settingsTextarea } from './fieldStyles';

const card = 'rounded-card border-line bg-surface border p-6 shadow-sm';

/** Enter in these fields must not submit the settings form around them. */
const noSubmit = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) e.preventDefault();
};

export default function CollectSection() {
  const t = useTranslations('Settings.collect');
  const setup = usePaymentSetup();
  const isOwner = can(useSession().role, 'settings');

  return (
    <section id="settings-collect" className="scroll-mt-24 space-y-4">
      <div>
        <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>
        <p className="text-muted mt-0.5 text-xs">{t('description')}</p>
      </div>
      {setup.isPending ? (
        <div className={cn(card, 'text-muted flex justify-center py-10')}>
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : setup.isError ? (
        <div className={cn(card, 'text-center')}>
          <p className="text-danger text-sm font-semibold">{t('loadError')}</p>
          <Button type="button" variant="outline" onClick={() => setup.refetch()} className="border-line-strong mt-3 h-9 text-xs font-bold">
            {t('retry')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <TransferCard initial={setup.data.transfer} canEdit={isOwner} />
          <PaymobCard paymob={setup.data.paymob} canEdit={isOwner} />
        </div>
      )}
    </section>
  );
}

const TRANSFER_FIELDS = ['bankName', 'accountName', 'accountNumber', 'instapayAddress', 'walletNumber'] as const;

function TransferCard({ initial, canEdit }: { initial: TransferDetails; canEdit: boolean }) {
  const t = useTranslations('Settings.collect.transfer');
  const errorMessage = useApiErrorMessage();
  const save = useSaveTransferDetails();
  const [values, setValues] = useState<Record<keyof TransferDetails, string>>(() => ({
    bankName: initial.bankName ?? '',
    accountName: initial.accountName ?? '',
    accountNumber: initial.accountNumber ?? '',
    instapayAddress: initial.instapayAddress ?? '',
    walletNumber: initial.walletNumber ?? '',
    instructions: initial.instructions ?? '',
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof TransferDetails, string>>>({});
  const changed = (Object.keys(values) as (keyof TransferDetails)[]).some((k) => values[k] !== (initial[k] ?? ''));

  async function submit() {
    setErrors({});
    try {
      await save.mutateAsync(values as TransferDetails);
      toast.success(t('saved'));
    } catch (error) {
      const fields = error instanceof ApiError ? error.details?.fieldErrors : undefined;
      if (fields) setErrors(Object.fromEntries(Object.keys(fields).map((k) => [k, t('invalid')])));
      else toast.error(errorMessage(error));
    }
  }

  return (
    <div className={card}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="bg-brand-soft text-brand flex size-9 items-center justify-center rounded-xl">
          <Landmark className="size-4.5" />
        </span>
        <div>
          <h3 className="text-ink text-sm font-extrabold">{t('title')}</h3>
          <p className="text-muted text-[11px]">{t('hint')}</p>
        </div>
      </div>
      <fieldset disabled={!canEdit} className="grid gap-3 sm:grid-cols-2">
        {TRANSFER_FIELDS.map((key) => (
          <div key={key} className={key === 'accountNumber' ? 'sm:col-span-2' : ''}>
            <label htmlFor={`collect-${key}`} className={settingsLabel}>
              {t(key)}
            </label>
            <input
              id={`collect-${key}`}
              dir={key === 'bankName' || key === 'accountName' ? undefined : 'ltr'}
              value={values[key]}
              placeholder={t(`placeholders.${key}`)}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              onKeyDown={noSubmit}
              aria-invalid={!!errors[key]}
              className={cn(settingsInput, (key === 'accountNumber' || key === 'instapayAddress' || key === 'walletNumber') && 'text-left')}
            />
            {errors[key] && <p className="text-danger mt-1 text-[11px] font-semibold">{errors[key]}</p>}
          </div>
        ))}
        <div className="sm:col-span-2">
          <label htmlFor="collect-instructions" className={settingsLabel}>
            {t('instructions')}
          </label>
          <textarea
            id="collect-instructions"
            rows={2}
            maxLength={300}
            value={values.instructions}
            placeholder={t('placeholders.instructions')}
            onChange={(e) => setValues((v) => ({ ...v, instructions: e.target.value }))}
            className={cn(settingsTextarea, 'min-h-16')}
          />
        </div>
      </fieldset>
      {canEdit && (
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={submit}
            disabled={!changed || save.isPending}
            className="rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white"
          >
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            {t('save')}
          </Button>
        </div>
      )}
    </div>
  );
}

function PaymobCard({ paymob, canEdit }: { paymob: PaymentSetup['paymob']; canEdit: boolean }) {
  const t = useTranslations('Settings.collect.paymob');
  // Card payments go through Paymob Egypt, in Egyptian pounds only.
  const egp = useCurrency() === 'EGP';
  const dateTime = useDateTime();
  const errorMessage = useApiErrorMessage();
  const disconnect = useDisconnectPaymob();

  async function unplug() {
    try {
      await disconnect.mutateAsync();
      toast.success(t('disconnected'));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className={card}>
      <div className="mb-4 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="bg-brand-soft text-brand flex size-9 items-center justify-center rounded-xl">
            <CreditCard className="size-4.5" />
          </span>
          <div>
            <h3 className="text-ink text-sm font-extrabold">{t('title')}</h3>
            <p className="text-muted text-[11px]">{t('hint')}</p>
          </div>
        </div>
        {paymob.connected && (
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold',
              paymob.live ? 'bg-brand-soft text-brand-deep' : 'bg-amber-50 text-amber-800',
            )}
          >
            {paymob.live ? t('live') : t('test')}
          </span>
        )}
      </div>

      {!egp && <p className="rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">{t('egpOnly')}</p>}

      {paymob.connected ? (
        <div className="space-y-3">
          <dl className="bg-canvas/60 rounded-btn grid gap-2 p-3 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t('publicKey')}</dt>
              <dd dir="ltr" className="text-ink truncate font-semibold">
                {paymob.publicKey}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t('integrationId')}</dt>
              <dd dir="ltr" className="text-ink font-semibold">
                {paymob.integrationId}
              </dd>
            </div>
            {paymob.connectedAt && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{t('connectedAt')}</dt>
                <dd className="text-ink font-semibold">{dateTime(paymob.connectedAt)}</dd>
              </div>
            )}
          </dl>
          {!paymob.live && <p className="rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">{t('testNote')}</p>}
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={unplug}
              disabled={disconnect.isPending}
              className="border-line-strong text-danger hover:text-danger h-9 gap-1.5 text-xs font-bold"
            >
              {disconnect.isPending ? <Loader2 className="size-4 animate-spin" /> : <Unplug className="size-4" />}
              {t('disconnect')}
            </Button>
          )}
        </div>
      ) : canEdit ? (
        <ConnectForm />
      ) : (
        <p className="text-muted text-xs">{t('notConnected')}</p>
      )}
    </div>
  );
}

const PAYMOB_FIELDS = ['secretKey', 'publicKey', 'hmacSecret', 'integrationId'] as const;

function ConnectForm() {
  const t = useTranslations('Settings.collect.paymob');
  const errorMessage = useApiErrorMessage();
  const connect = useConnectPaymob();
  const [values, setValues] = useState<PaymobAccountInput>({ secretKey: '', publicKey: '', hmacSecret: '', integrationId: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof PaymobAccountInput | 'form', string>>>({});
  const ready = PAYMOB_FIELDS.every((k) => values[k].trim() !== '');

  async function submit() {
    setErrors({});
    try {
      await connect.mutateAsync({
        secretKey: values.secretKey.trim(),
        publicKey: values.publicKey.trim(),
        hmacSecret: values.hmacSecret.trim(),
        integrationId: values.integrationId.trim(),
      });
      toast.success(t('connected'));
    } catch (error) {
      const code = error instanceof ApiError ? error.code : '';
      const fields = error instanceof ApiError ? error.details?.fieldErrors : undefined;
      if (code === 'PAYMOB_SECRET_INVALID') setErrors({ secretKey: errorMessage(error) });
      else if (code === 'PAYMOB_INTEGRATION_INVALID') setErrors({ integrationId: errorMessage(error) });
      else if (fields) setErrors(Object.fromEntries(Object.keys(fields).map((k) => [k, t(`errors.${k}`)])));
      else setErrors({ form: errorMessage(error) });
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-body text-xs leading-6">{t('howTo')}</p>
      {PAYMOB_FIELDS.map((key) => (
        <div key={key}>
          <label htmlFor={`paymob-${key}`} className={settingsLabel}>
            {t(key)}
          </label>
          <input
            id={`paymob-${key}`}
            dir={values[key] ? 'ltr' : undefined}
            type={key === 'secretKey' || key === 'hmacSecret' ? 'password' : 'text'}
            inputMode={key === 'integrationId' ? 'numeric' : undefined}
            autoComplete="off"
            spellCheck={false}
            value={values[key]}
            placeholder={t(`placeholders.${key}`)}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            onKeyDown={noSubmit}
            aria-invalid={!!errors[key]}
            className={settingsInput}
          />
          {errors[key] && <p className="text-danger mt-1 text-[11px] font-semibold">{errors[key]}</p>}
        </div>
      ))}
      {errors.form && <p className="bg-danger-soft text-danger rounded-btn px-3 py-2 text-xs font-semibold">{errors.form}</p>}
      <p className="text-muted text-[11px] leading-5">{t('checkNote')}</p>
      <Button
        type="button"
        onClick={submit}
        disabled={!ready || connect.isPending}
        className="rounded-btn bg-brand hover:bg-brand/90 h-10 w-full gap-2 text-xs font-bold text-white"
      >
        {connect.isPending ? <Loader2 className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
        {t('connect')}
      </Button>
    </div>
  );
}
