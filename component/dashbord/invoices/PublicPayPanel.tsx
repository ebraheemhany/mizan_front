// component/dashbord/invoices/PublicPayPanel.tsx
// How the customer pays, on the public invoice link: by card through the company's
// own Paymob account, or by a transfer made outside Mizan, reported with its
// receipt (the company reviews it before it counts).
'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, Copy, CreditCard, FileUp, Loader2, Receipt, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useOnlinePaymentStatus, useStartCheckout, useSubmitClaim, type ClaimInput } from '@/lib/collections/hooks';
import { useDate } from '@/lib/data';
import { RECEIPT_MAX_BYTES, RECEIPT_TYPES } from '@/lib/expenses/hooks';
import type { PublicPayOptions } from '@/lib/invoices/hooks';
import { useMoney } from '@/lib/money';
import { queryKeys } from '@/lib/query/keys';
import { cn } from '@/lib/utils';

const inputClass =
  'h-11 rounded-btn border-line-strong bg-surface shadow-sm focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/10';

export default function PublicPayPanel({
  token,
  pay,
  status,
  issueDate,
}: {
  token: string;
  pay: PublicPayOptions;
  status: string;
  issueDate: string;
}) {
  const t = useTranslations('PublicPay');
  const money = useMoney();
  // Back from Paymob: ?checkout=<id> (read once; this panel only renders in the browser).
  const [checkoutId] = useState(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('checkout'),
  );

  const nothingToShow = !pay.payable && pay.claims.length === 0 && !checkoutId;
  if (nothingToShow) {
    return status === 'paid' ? (
      <section className="rounded-card border-brand/25 bg-brand-soft/50 flex items-center gap-3 border p-5">
        <CheckCircle2 className="text-brand size-6 shrink-0" />
        <p className="text-ink text-sm font-bold">{t('paidInFull')}</p>
      </section>
    ) : null;
  }

  return (
    <section className="rounded-card border-line bg-surface space-y-5 border p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-ink text-lg font-extrabold">{t('title')}</h2>
          {pay.payable && <p className="text-muted mt-0.5 text-xs">{t('subtitle')}</p>}
        </div>
        {pay.payable && (
          <p className="text-ink text-sm">
            {t('due')}{' '}
            <span className="text-brand-deep text-xl font-extrabold tabular-nums">{money(Number(pay.remaining))}</span>
          </p>
        )}
      </div>

      {checkoutId && <CheckoutResult token={token} id={checkoutId} />}

      {pay.payable && pay.online && <PayByCard token={token} test={pay.online.test} />}

      {pay.payable && pay.transfer && <TransferDetails transfer={pay.transfer} />}

      {pay.payable && <ClaimForm token={token} remaining={pay.remaining} issueDate={issueDate} hasOtherWays={Boolean(pay.online || pay.transfer)} />}

      {pay.claims.length > 0 && <ClaimsList claims={pay.claims} />}
    </section>
  );
}

/** After Paymob sends the customer back: how the payment ended (asked until it's settled). */
function CheckoutResult({ token, id }: { token: string; id: string }) {
  const t = useTranslations('PublicPay.checkout');
  const queryClient = useQueryClient();
  const status = useOnlinePaymentStatus(token, id);
  const state = status.data?.status;

  // Once paid, the invoice above shows it paid too.
  useEffect(() => {
    if (state === 'paid') void queryClient.invalidateQueries({ queryKey: queryKeys.publicInvoice(token) });
  }, [state, queryClient, token]);

  if (status.isError) return null;
  const tone = state === 'paid' ? 'border-brand/25 bg-brand-soft/60' : state === 'failed' ? 'border-danger/25 bg-danger-soft' : 'border-line bg-canvas';
  return (
    <div role="status" className={cn('rounded-btn flex items-center gap-3 border p-4 text-sm font-bold', tone)}>
      {state === 'paid' ? (
        <CheckCircle2 className="text-brand size-5 shrink-0" />
      ) : state === 'failed' ? (
        <XCircle className="text-danger size-5 shrink-0" />
      ) : (
        <Loader2 className="text-muted size-5 shrink-0 animate-spin" />
      )}
      <span className="text-ink">{t(state ?? 'pending')}</span>
    </div>
  );
}

function PayByCard({ token, test }: { token: string; test: boolean }) {
  const t = useTranslations('PublicPay.card');
  const locale = useLocale() === 'en' ? 'en' : 'ar';
  const errorMessage = useApiErrorMessage();
  const start = useStartCheckout(token);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setError(null);
    try {
      const { url } = await start.mutateAsync(locale);
      window.location.href = url;
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="rounded-btn border-line bg-canvas/50 border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-brand-soft text-brand flex size-10 shrink-0 items-center justify-center rounded-xl">
            <CreditCard className="size-5" />
          </span>
          <div>
            <p className="text-ink text-sm font-extrabold">{t('title')}</p>
            <p className="text-muted text-xs">{t('hint')}</p>
          </div>
        </div>
        <Button
          type="button"
          onClick={go}
          disabled={start.isPending || start.isSuccess}
          className="rounded-btn bg-brand hover:bg-brand/90 h-11 px-6 text-sm font-bold text-white"
        >
          {(start.isPending || start.isSuccess) && <Loader2 className="size-4 animate-spin" />}
          {t('pay')}
        </Button>
      </div>
      {test && <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">{t('test')}</p>}
      {error && (
        <p role="alert" className="text-danger mt-2 text-xs font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}

function TransferDetails({ transfer }: { transfer: NonNullable<PublicPayOptions['transfer']> }) {
  const t = useTranslations('PublicPay.transfer');
  const rows = (
    [
      ['bankName', transfer.bankName, false],
      ['accountName', transfer.accountName, false],
      ['accountNumber', transfer.accountNumber, true],
      ['instapayAddress', transfer.instapayAddress, true],
      ['walletNumber', transfer.walletNumber, true],
    ] as const
  ).filter(([, value]) => value);

  return (
    <div className="rounded-btn border-line border p-4">
      <p className="text-ink text-sm font-extrabold">{t('title')}</p>
      <dl className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {rows.map(([key, value, copyable]) => (
          <div key={key} className="bg-canvas/60 rounded-lg px-3 py-2">
            <dt className="text-muted text-[11px]">{t(key)}</dt>
            <dd className="mt-0.5 flex items-center justify-between gap-2">
              <span dir="auto" className="text-ink text-sm font-bold break-all">
                {value}
              </span>
              {copyable && <CopyButton value={value!} />}
            </dd>
          </div>
        ))}
      </dl>
      {transfer.instructions && <p className="text-body mt-3 text-xs leading-6 whitespace-pre-line">{transfer.instructions}</p>}
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const t = useTranslations('PublicPay.transfer');
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label={t('copy')}
      className="text-muted hover:text-brand hover:bg-surface shrink-0 rounded-md p-1.5 transition-colors"
    >
      {copied ? <Check className="text-brand size-4" /> : <Copy className="size-4" />}
    </button>
  );
}

type Problems = Partial<Record<'amount' | 'date' | 'file' | 'form', string>>;

/** "I've paid by transfer": the amount, how, and the receipt (required). */
function ClaimForm({
  token,
  remaining,
  issueDate,
  hasOtherWays,
}: {
  token: string;
  remaining: string;
  issueDate: string;
  hasOtherWays: boolean;
}) {
  const t = useTranslations('PublicPay.claim');
  const errorMessage = useApiErrorMessage();
  const submit = useSubmitClaim(token);
  const fileInput = useRef<HTMLInputElement>(null);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  const [open, setOpen] = useState(!hasOtherWays);
  const [sent, setSent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [problems, setProblems] = useState<Problems>({});
  const [values, setValues] = useState<ClaimInput>({
    amount: remaining,
    date: today,
    method: 'instapay',
    reference: '',
    payerName: '',
    note: '',
  });
  const set = (key: keyof ClaimInput) => (value: string) => setValues((v) => ({ ...v, [key]: value }));

  function pickFile(picked: File | null) {
    if (!picked) return;
    const problem = !RECEIPT_TYPES.includes(picked.type) ? t('errors.fileType') : picked.size > RECEIPT_MAX_BYTES ? t('errors.fileSize') : null;
    setProblems((p) => ({ ...p, file: problem ?? undefined }));
    setFile(problem ? null : picked);
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const found: Problems = {};
    const amount = Number(values.amount);
    if (!(amount > 0)) found.amount = t('errors.amount');
    else if (amount > Number(remaining)) found.amount = t('errors.amountTooHigh');
    if (!values.date) found.date = t('errors.date');
    if (!file) found.file = t('errors.file');
    setProblems(found);
    if (Object.keys(found).length > 0 || !file) return;
    try {
      await submit.mutateAsync({ input: values, file });
      setSent(true);
      setOpen(false);
      setFile(null);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      const field = code === 'PAYMENT_EXCEEDS_BALANCE' ? 'amount' : code.startsWith('PAYMENT_DATE') || code === 'PAYMENT_BEFORE_ISSUE' ? 'date' : code.startsWith('FILE_') ? 'file' : 'form';
      setProblems({ [field]: errorMessage(err) });
    }
  }

  if (!open) {
    return (
      <div className="space-y-3">
        {sent && (
          <p role="status" className="rounded-btn border-brand/25 bg-brand-soft/60 flex items-center gap-2 border px-4 py-3 text-sm font-bold">
            <CheckCircle2 className="text-brand size-5 shrink-0" />
            {t('sent')}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen(true);
            setSent(false);
          }}
          className="rounded-btn border-line-strong h-11 w-full gap-2 text-sm font-bold"
        >
          <Receipt className="size-4" />
          {t('open')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={send} noValidate className="rounded-btn border-line space-y-4 border p-4">
      <div>
        <p className="text-ink text-sm font-extrabold">{t('title')}</p>
        <p className="text-muted mt-0.5 text-xs leading-5">{t('hint')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="claim-amount" className="text-ink mb-1.5 text-xs font-bold">
            {t('amount')}
          </Label>
          <Input
            id="claim-amount"
            inputMode="decimal"
            dir="ltr"
            value={values.amount}
            onChange={(e) => set('amount')(e.target.value)}
            aria-invalid={!!problems.amount}
            className={cn(inputClass, 'text-start tabular-nums')}
          />
          {problems.amount && <FieldProblem text={problems.amount} />}
        </div>
        <div>
          <Label htmlFor="claim-date" className="text-ink mb-1.5 text-xs font-bold">
            {t('date')}
          </Label>
          <Input
            id="claim-date"
            type="date"
            min={issueDate}
            max={today}
            value={values.date}
            onChange={(e) => set('date')(e.target.value)}
            aria-invalid={!!problems.date}
            className={inputClass}
          />
          {problems.date && <FieldProblem text={problems.date} />}
        </div>
      </div>

      <fieldset>
        <legend className="text-ink mb-1.5 text-xs font-bold">{t('method')}</legend>
        <div className="grid grid-cols-3 gap-2">
          {(['instapay', 'bank', 'vodafoneCash'] as const).map((method) => (
            <label
              key={method}
              className={cn(
                'rounded-btn flex h-11 cursor-pointer items-center justify-center border px-2 text-center text-xs font-bold transition-colors',
                values.method === method ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-2 hover:bg-canvas',
              )}
            >
              <input
                type="radio"
                name="claim-method"
                value={method}
                checked={values.method === method}
                onChange={() => set('method')(method)}
                className="sr-only"
              />
              {t(`methods.${method}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="claim-reference" className="text-ink mb-1.5 text-xs font-bold">
            {t('reference')}
          </Label>
          <Input
            id="claim-reference"
            dir="auto"
            maxLength={100}
            placeholder={t('referencePlaceholder')}
            value={values.reference}
            onChange={(e) => set('reference')(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <Label htmlFor="claim-payer" className="text-ink mb-1.5 text-xs font-bold">
            {t('payerName')}
          </Label>
          <Input
            id="claim-payer"
            maxLength={100}
            value={values.payerName}
            onChange={(e) => set('payerName')(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <p className="text-ink mb-1.5 text-xs font-bold">{t('receipt')}</p>
        <input
          ref={fileInput}
          type="file"
          accept={RECEIPT_TYPES.join(',')}
          className="sr-only"
          id="claim-file"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        <label
          htmlFor="claim-file"
          className={cn(
            'rounded-btn flex cursor-pointer items-center gap-3 border border-dashed p-4 transition-colors',
            problems.file ? 'border-danger bg-danger-soft/40' : file ? 'border-brand bg-brand-soft/40' : 'border-line-strong hover:bg-canvas',
          )}
        >
          <FileUp className={cn('size-5 shrink-0', file ? 'text-brand' : 'text-muted')} />
          <span className="min-w-0 text-xs">
            <span className="text-ink block truncate font-bold">{file ? file.name : t('pickFile')}</span>
            <span className="text-muted">{t('fileHint')}</span>
          </span>
        </label>
        {problems.file && <FieldProblem text={problems.file} />}
      </div>

      <div>
        <Label htmlFor="claim-note" className="text-ink mb-1.5 text-xs font-bold">
          {t('note')}
        </Label>
        <Textarea
          id="claim-note"
          rows={2}
          maxLength={300}
          value={values.note}
          onChange={(e) => set('note')(e.target.value)}
          className="rounded-btn border-line-strong bg-surface resize-none"
        />
      </div>

      {problems.form && (
        <p role="alert" className="bg-danger-soft text-danger rounded-btn px-3 py-2.5 text-sm font-semibold">
          {problems.form}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {hasOtherWays && (
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-btn border-line-strong h-11 px-6 text-sm font-bold">
            {t('cancel')}
          </Button>
        )}
        <Button type="submit" disabled={submit.isPending} className="rounded-btn bg-brand hover:bg-brand/90 h-11 px-6 text-sm font-bold text-white">
          {submit.isPending && <Loader2 className="size-4 animate-spin" />}
          {t('submit')}
        </Button>
      </div>
    </form>
  );
}

function FieldProblem({ text }: { text: string }) {
  return (
    <p role="alert" className="text-danger mt-1.5 text-xs font-semibold">
      {text}
    </p>
  );
}

/** The receipts this customer already sent, and what became of them. */
function ClaimsList({ claims }: { claims: PublicPayOptions['claims'] }) {
  const t = useTranslations('PublicPay.claims');
  const tMethods = useTranslations('PublicPay.claim.methods');
  const money = useMoney();
  const date = useDate();
  const tone = {
    pending: 'bg-amber-50 text-amber-800',
    accepted: 'bg-brand-soft text-brand-deep',
    rejected: 'bg-danger-soft text-danger',
  } as const;

  return (
    <div>
      <p className="text-ink text-sm font-extrabold">{t('title')}</p>
      <ul className="divide-line mt-2 divide-y">
        {claims.map((c) => (
          <li key={c.id} className="py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-ink text-sm font-bold tabular-nums">{money(Number(c.amount))}</p>
              <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold', tone[c.status])}>{t(`status.${c.status}`)}</span>
            </div>
            <p className="text-muted mt-0.5 text-xs">
              {date(c.date)} · {tMethods(c.method)}
            </p>
            {c.status === 'rejected' && c.rejectReason && (
              <p className="text-danger mt-1 text-xs">{t('reason', { reason: c.rejectReason })}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
