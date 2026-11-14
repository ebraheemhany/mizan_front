// components/app/ConfirmDialog.tsx
'use client';

import { Trash2 } from 'lucide-react';
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

export default function ConfirmDialog({
  open,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AlertDialogContent className="rounded-card border-line bg-surface text-ink shadow-float gap-0 overflow-hidden border p-0 sm:max-w-md">
        <div className="flex flex-col items-center px-7 pb-7 pt-8 text-center">
          <span className="bg-danger-soft text-danger ring-danger/10 flex size-14 items-center justify-center rounded-2xl ring-1">
            <Trash2 className="size-6" />
          </span>

          <AlertDialogHeader className="mt-5 min-w-0 place-items-center gap-2.5 text-center sm:text-center">
            <AlertDialogTitle className="text-ink max-w-full text-center text-xl leading-7 font-extrabold">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted max-w-sm text-center text-sm leading-6">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <AlertDialogFooter className="border-line bg-canvas/50 mx-0 mb-0 grid grid-cols-2 gap-3 border-t px-6 py-5 sm:gap-3">
          <AlertDialogCancel className="rounded-btn border-line-strong bg-surface text-ink hover:border-brand/40 hover:bg-brand-soft hover:text-brand-deep focus-visible:ring-brand/20 h-11 px-4 font-bold shadow-sm">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-btn bg-danger hover:bg-danger/90 focus-visible:ring-danger/30 h-11 gap-2 px-4 font-bold text-white shadow-sm"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
