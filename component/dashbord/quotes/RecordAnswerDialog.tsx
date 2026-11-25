// components/quotes/RecordAnswerDialog.tsx
// Asks before staff record a customer's answer by hand. Customers normally accept or
// reject a quote themselves from its link; this is for an answer given outside Mizan
// (phone, WhatsApp, in person), and the quote's history says the team recorded it.
'use client';

import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ConfirmDialog from '@/component/ConfirmDialog';

export type AnswerTarget<Q> = { quote: Q; kind: 'accept' | 'reject' } | null;

export default function RecordAnswerDialog<Q extends { displayNumber: string; customer: string }>({
  target,
  onConfirm,
  onClose,
}: {
  target: AnswerTarget<Q>;
  onConfirm: (quote: Q, kind: 'accept' | 'reject') => void;
  onClose: () => void;
}) {
  const t = useTranslations('Quotes');
  const accept = target?.kind !== 'reject';
  const values = { number: target?.quote.displayNumber ?? '', customer: target?.quote.customer ?? '' };

  return (
    <ConfirmDialog
      open={target !== null}
      tone={accept ? 'brand' : 'danger'}
      icon={accept ? Check : X}
      title={t(accept ? 'answerDialog.acceptTitle' : 'answerDialog.rejectTitle', values)}
      description={t(accept ? 'answerDialog.acceptDescription' : 'answerDialog.rejectDescription', values)}
      cancelLabel={t('answerDialog.cancel')}
      confirmLabel={t(accept ? 'actions.accept' : 'actions.reject')}
      onConfirm={() => {
        if (target) onConfirm(target.quote, target.kind);
        onClose();
      }}
      onClose={onClose}
    />
  );
}
