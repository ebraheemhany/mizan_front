// components/invoices/PaymentsCard.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { openPaymentProof, uploadPaymentProof } from '@/lib/collections/hooks';
import { useDate } from '@/lib/data';
import { RECEIPT_TYPES, receiptProblem } from '@/lib/expenses/hooks';
import { useRefreshInvoice } from '@/lib/invoices/hooks';
import type { Payment } from '@/lib/mock/invoice-details';
import { useMoney } from '@/lib/money';

export default function PaymentsCard({ payments, canAttach = false }: { payments: Payment[]; canAttach?: boolean }) {
  const t = useTranslations('InvoiceDetail.payments');
  const tDialog = useTranslations('InvoiceDetail.paymentDialog');
  const tStatus = useTranslations('Payments.status');
  const money = useMoney();
  const date = useDate();
  const errorMessage = useApiErrorMessage();
  const refresh = useRefreshInvoice();
  const [uploading, setUploading] = useState<string | null>(null);

  async function viewProof(id: string) {
    try {
      await openPaymentProof(id);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function attachProof(id: string, file: File | undefined) {
    if (!file) return;
    const problem = receiptProblem(file);
    if (problem) {
      toast.error(tDialog(`errors.${problem}`));
      return;
    }
    setUploading(id);
    try {
      await uploadPaymentProof(id, file);
      refresh();
      toast.success(t('proofAttached'));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploading(null);
    }
  }

  return (
    <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
      <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>

      {payments.length === 0 ? (
        <p className="text-muted mt-3 text-xs">{t('empty')}</p>
      ) : (
        <ul className="divide-line mt-3 divide-y">
          {payments.map((p) => (
            <li key={p.id} className="py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-brand-deep text-sm font-extrabold tabular-nums">
                  {money(p.amount)}
                </p>
                {p.number && (
                  <span dir="ltr" className="text-muted text-[11px] tabular-nums">
                    {p.number}
                  </span>
                )}
              </div>
              <p className="text-muted mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
                <span>
                  {date(p.date)} · {t(`methods.${p.method}`)}
                </span>
                {/* Paid on the link: by card, or a customer's receipt someone accepted. */}
                {p.source && (
                  <span className="bg-info-soft text-info rounded-full px-2 py-0.5 text-[10px] font-bold">
                    {t(`sources.${p.source}`)}
                  </span>
                )}
                {/* A cheque lowers the balance at once but is collected only when it clears. */}
                {p.status === 'pending' && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {tStatus('pending')}
                  </span>
                )}
                {/* Returned by the bank: it paid nothing (the amount is owed again). */}
                {p.status === 'bounced' && (
                  <span className="bg-danger-soft text-danger rounded-full px-2 py-0.5 text-[10px] font-bold">
                    {tStatus('bounced')}
                  </span>
                )}
              </p>
              {p.reference && (
                <p className="text-body mt-1 text-xs">
                  {t('reference')}{' '}
                  <span dir="auto" className="text-ink font-semibold">
                    {p.reference}
                  </span>
                </p>
              )}
              {p.note && <p className="text-body mt-1 text-xs">{p.note}</p>}
              {p.hasProof ? (
                <button
                  type="button"
                  onClick={() => viewProof(p.id)}
                  className="text-brand mt-1.5 inline-flex items-center gap-1 text-xs font-bold hover:underline"
                >
                  <Paperclip className="size-3.5" />
                  {t('viewProof')}
                </button>
              ) : (
                canAttach &&
                p.status !== 'bounced' && (
                  <label className="text-muted hover:text-brand mt-1.5 inline-flex cursor-pointer items-center gap-1 text-xs font-bold">
                    {uploading === p.id ? <Loader2 className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />}
                    {t('attachProof')}
                    <input
                      type="file"
                      accept={RECEIPT_TYPES.join(',')}
                      className="sr-only"
                      disabled={uploading !== null}
                      onChange={(e) => {
                        void attachProof(p.id, e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
