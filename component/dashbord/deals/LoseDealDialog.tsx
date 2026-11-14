// components/deals/LoseDealDialog.tsx
'use client';

import { useState } from 'react';
import { TrendingDown, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChipGroup, FieldError } from '@/component/form-parts';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LOSS_REASONS, type Deal, type LossReason } from '@/lib/mock/deals';
import { useMoney } from '@/lib/money';

function LoseForm({
  onConfirm,
  onCancel,
}: {
  onConfirm: (reason: LossReason, note: string) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('Deals.lost.dialog');
  const tr = useTranslations('Deals.lost.reasons');

  const [reason, setReason] = useState<LossReason | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<'reason' | 'note' | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!reason) {
      setError('reason');
      return;
    }
    if (note.length > 300) {
      setError('note');
      return;
    }
    onConfirm(reason, note.trim());
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-5 px-6 py-5">
        <div>
          <p id="lose-reason-label" className="text-ink mb-2 text-sm font-bold">
            {t('reason')}
          </p>
          <ChipGroup
            labelId="lose-reason-label"
            value={reason ?? ''}
            onChange={(v) => {
              setReason(v as LossReason);
              setError(null);
            }}
            className="sm:grid-cols-2"
            options={LOSS_REASONS.map((r) => ({ value: r as string, label: tr(r) }))}
          />
          <FieldError message={error === 'reason' ? t('reasonRequired') : undefined} />
        </div>

        <div>
          <Label htmlFor="lose-note" className="text-ink mb-2 text-sm font-bold">
            {t('note')}
          </Label>
          <Textarea
            id="lose-note"
            rows={3}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (error === 'note') setError(null);
            }}
            placeholder={t('notePlaceholder')}
            aria-invalid={error === 'note'}
            className="rounded-btn border-line-strong bg-surface resize-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15"
          />
          <FieldError message={error === 'note' ? t('noteMax') : undefined} />
        </div>
      </div>

      <DialogFooter className="border-line bg-canvas/60 gap-2 border-t px-6 py-4 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-11 px-6 font-bold"
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          className="rounded-btn bg-danger hover:bg-danger/90 focus-visible:ring-danger/30 h-11 gap-2 px-6 font-bold text-white"
        >
          <TrendingDown className="size-4" />
          {t('confirm')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function LoseDealDialog({
  deal,
  onConfirm,
  onClose,
}: {
  deal: Deal | null;
  onConfirm: (reason: LossReason, note: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations('Deals.lost.dialog');
  const money = useMoney();

  return (
    <Dialog
      open={deal !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="rounded-card border-line bg-surface text-ink shadow-float gap-0 overflow-hidden border p-0 sm:max-w-lg"
      >
        <div className="bg-canvas/60 border-line relative flex items-start gap-3.5 border-b px-6 py-5">
          <span className="bg-danger-soft text-danger flex size-12 shrink-0 items-center justify-center rounded-full">
            <TrendingDown className="size-5" />
          </span>

          <DialogHeader className="min-w-0 gap-1 pe-8 text-start">
            <DialogTitle className="text-ink text-lg font-extrabold">{t('title')}</DialogTitle>
            <DialogDescription className="sr-only">
              {deal
                ? t('description', {
                    title: deal.title,
                    customer: deal.customer,
                    amount: money(deal.value),
                  })
                : ''}
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="text-muted hover:bg-surface hover:text-ink absolute end-4 top-4 rounded-full p-2 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {deal && (
          <div className="rounded-card border-line bg-canvas/60 mx-6 mt-5 flex items-center justify-between gap-4 border p-4">
            <div className="min-w-0">
              <p className="text-ink truncate text-sm font-bold">{deal.title}</p>
              <p className="text-muted mt-1 truncate text-xs">{deal.customer}</p>
            </div>
            <span className="bg-danger-soft text-danger shrink-0 rounded-full px-3 py-1.5 text-sm font-extrabold tabular-nums">
              {money(deal.value)}
            </span>
          </div>
        )}

        {/* الـ key بيصفّر النموذج مع كل صفقة */}
        <LoseForm key={deal?.id} onConfirm={onConfirm} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}