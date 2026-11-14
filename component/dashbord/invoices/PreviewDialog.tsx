// components/invoices/PreviewDialog.tsx
'use client';

import { Eye, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { InvoiceDetail } from '@/lib/mock/invoice-details';
import InvoiceDocument from './InvoiceDocument';

export default function PreviewDialog({
  open,
  onOpenChange,
  invoice,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceDetail;
}) {
  const t = useTranslations('InvoiceDetail.preview');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="rounded-card border-line bg-surface text-ink shadow-float flex max-h-[90dvh] flex-col gap-0 overflow-hidden border p-0 sm:max-w-3xl"
      >
        <div className="border-line bg-brand-soft/60 relative flex shrink-0 items-center gap-3.5 border-b px-6 py-5">
          <span className="bg-surface text-brand ring-brand/10 flex size-11 shrink-0 items-center justify-center rounded-xl ring-1">
            <Eye className="size-5" />
          </span>

          <DialogHeader className="min-w-0 gap-0.5 pe-8 text-start">
            <DialogTitle className="text-ink text-lg font-extrabold">
              {t('title')}
            </DialogTitle>
            <DialogDescription className="text-muted truncate text-xs">
              {t('description', { customer: invoice.customer })}
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('close')}
            className="text-muted hover:bg-surface hover:text-ink absolute end-4 top-4 rounded-lg p-1.5 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="bg-canvas/50 min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 [scrollbar-color:var(--color-line-strong)_transparent] [scrollbar-width:thin] sm:p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-line-strong [&::-webkit-scrollbar-thumb:hover]:bg-brand">
          <InvoiceDocument
            invoice={invoice}
            className="mx-auto max-w-3xl shadow-sm"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
