// components/invoices/CancelInvoiceDialog.tsx
'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Invoice } from '@/lib/mock/invoices';

export default function CancelInvoiceDialog({
  invoices,
  onConfirm,
  onClose,
}: {
  invoices: Invoice[] | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('Invoices.cancelDialog');
  const singleInvoice = invoices?.length === 1 ? invoices[0] : null;

  return (
    <AlertDialog
      open={!!invoices?.length}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent className="rounded-card border-line bg-surface text-ink shadow-float gap-0 overflow-hidden border p-0 sm:max-w-sm">
        <div className="flex flex-col items-center px-6 pb-6 pt-7 text-center">
          <span className="bg-danger-soft text-danger flex size-12 items-center justify-center rounded-full">
            <TriangleAlert className="size-5" />
          </span>

          <AlertDialogHeader className="mt-4 min-w-0 place-items-center gap-2 text-center">
            <AlertDialogTitle className="text-ink text-lg font-extrabold">
              {singleInvoice
                ? t('title', { number: String(singleInvoice.number) })
                : t('bulkTitle', { count: invoices?.length ?? 0 })}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted max-w-xs text-sm leading-6">
              {singleInvoice
                ? t('description', { customer: singleInvoice.customer })
                : t('bulkDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <AlertDialogFooter className="border-line bg-canvas/60 grid grid-cols-2 gap-2 border-t px-5 py-4 sm:gap-2">
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-btn bg-danger hover:bg-danger/90 focus-visible:ring-danger/30 h-11 px-3 font-bold text-white"
          >
            {t('confirm')}
          </AlertDialogAction>
          <AlertDialogCancel className="rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-11 px-3 font-bold">
            {t('keep')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
