// component/dashbord/accounts/AccountDialog.tsx
// Adds an account to the chart, or renames/renumbers one the company added.
'use client';

import { useState } from 'react';
import { BookPlus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  dialogCancelButton,
  dialogClose,
  dialogConfirmButton,
  dialogDescription,
  dialogFooterBar,
  dialogHeaderBar,
  dialogHeading,
  dialogIconTile,
  dialogPopup,
  dialogTitle,
} from '@/component/dialog-chrome';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { ACCOUNT_TYPES, useSaveAccount, type AccountType, type LedgerAccount } from '@/lib/ledger/hooks';
import { cn } from '@/lib/utils';

const fieldClass =
  'rounded-btn border-line-strong bg-surface hover:border-brand/50 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 h-11';

function AccountForm({ account, onDone }: { account: LedgerAccount | null; onDone: () => void }) {
  const t = useTranslations('Accounts.accountDialog');
  const tTypes = useTranslations('Accounts.types');
  const errorMessage = useApiErrorMessage();
  const save = useSaveAccount();

  const [code, setCode] = useState(account?.code ?? '');
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState<AccountType>(account?.type ?? 'expense');
  const [errors, setErrors] = useState<{ code?: string; name?: string }>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\d{2,10}$/.test(code.trim())) next.code = t('errors.code');
    if (!name.trim()) next.name = t('errors.nameRequired');
    else if (name.trim().length > 80) next.name = t('errors.nameMax');
    setErrors(next);
    if (next.code || next.name) return;

    try {
      await save.mutateAsync({ id: account?.id, input: { code: code.trim(), name: name.trim(), type } });
      toast.success(t(account ? 'updated' : 'added'));
      onDone();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'ACCOUNT_CODE_USED') setErrors({ code: errorMessage(error) });
      else toast.error(errorMessage(error));
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-5 px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <div>
            <Label htmlFor="account-code" className="text-ink mb-2 text-sm font-bold">
              {t('code')}
            </Label>
            <Input
              id="account-code"
              dir="ltr"
              inputMode="numeric"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              aria-invalid={!!errors.code}
              className={`${fieldClass} tabular-nums`}
            />
          </div>
          <div>
            <Label htmlFor="account-name" className="text-ink mb-2 text-sm font-bold">
              {t('name')}
            </Label>
            <Input
              id="account-name"
              autoComplete="off"
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
              className={fieldClass}
            />
          </div>
        </div>
        <FieldError message={errors.code ?? errors.name} />

        {/* The type decides where the account goes in the statements; it can't change later. */}
        {!account && (
          <div>
            <p id="account-type-label" className="text-ink mb-2 text-sm font-bold">
              {t('type')}
            </p>
            <ChipGroup
              labelId="account-type-label"
              value={type}
              onChange={(v) => setType(v as AccountType)}
              className="grid-cols-2 sm:grid-cols-3"
              options={ACCOUNT_TYPES.map((v) => ({ value: v, label: tTypes(v) }))}
            />
            <p className="text-muted mt-2 text-xs">{t('typeHint')}</p>
          </div>
        )}
      </div>

      <DialogFooter className={dialogFooterBar}>
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          className={dialogCancelButton}
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          disabled={save.isPending}
          className={cn(dialogConfirmButton, 'bg-brand hover:bg-brand/90')}
        >
          {t(account ? 'save' : 'add')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function AccountDialog({
  open,
  account,
  onClose,
}: {
  open: boolean;
  /** An added account to edit; null to add one. */
  account: LedgerAccount | null;
  onClose: () => void;
}) {
  const t = useTranslations('Accounts.accountDialog');
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(dialogPopup, 'sm:max-w-lg')}
      >
        <div className={dialogHeaderBar()}>
          <span className={dialogIconTile()}>
            <BookPlus className="size-5" />
          </span>
          <DialogHeader className={dialogHeading}>
            <DialogTitle className={dialogTitle}>{t(account ? 'editTitle' : 'title')}</DialogTitle>
            <DialogDescription className={dialogDescription}>{t('description')}</DialogDescription>
          </DialogHeader>
          <button type="button" onClick={onClose} aria-label={t('close')} className={dialogClose}>
            <X className="size-4" />
          </button>
        </div>
        {open && <AccountForm key={account?.id ?? 'new'} account={account} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
