// component/dashbord/employees/DocumentsCard.tsx
// Files on an employee's record: a contract, an ID card... (images or PDF, up to 5 MB).
'use client';

import { useRef, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { FileImage, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import ConfirmDialog from '@/component/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import {
  DOCUMENT_MAX_BYTES,
  DOCUMENT_TYPES,
  openDocument,
  useAddDocument,
  useDeleteDocument,
  type EmployeeDetail,
  type EmployeeDocument,
} from '@/lib/payroll/hooks';
import { cn } from '@/lib/utils';
import { cardClass, fieldClass, outlineBtn } from './shared';

export default function DocumentsCard({ employee }: { employee: EmployeeDetail }) {
  const t = useTranslations('Employees.documents');
  const format = useFormatter();
  const errorMessage = useApiErrorMessage();
  const add = useAddDocument();
  const remove = useDeleteDocument();
  const input = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [removing, setRemoving] = useState<EmployeeDocument | null>(null);

  function upload(file: File | undefined) {
    if (!file) return;
    if (!DOCUMENT_TYPES.includes(file.type)) return void toast.error(t('wrongType'));
    if (file.size > DOCUMENT_MAX_BYTES) return void toast.error(t('tooBig'));
    add.mutate(
      { id: employee.id, file, title: title.trim() },
      {
        onSuccess: () => {
          setTitle('');
          toast.success(t('added'));
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  }

  const size = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${format.number(bytes / 1024 / 1024, { maximumFractionDigits: 1, numberingSystem: 'latn' })} MB`
      : `${format.number(Math.max(1, Math.round(bytes / 1024)), { numberingSystem: 'latn' })} KB`;

  return (
    <section className={cardClass}>
      <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>
      <p className="text-muted mt-1 text-xs">{t('hint')}</p>

      <div className="mt-4 flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder={t('titlePlaceholder')} aria-label={t('titleLabel')} className={cn(fieldClass, 'h-10 min-w-0 flex-1')} />
        <Button type="button" variant="outline" disabled={add.isPending} onClick={() => input.current?.click()} className={cn(outlineBtn, 'shrink-0')}>
          {add.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {t('upload')}
        </Button>
        <input
          ref={input}
          type="file"
          accept={DOCUMENT_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      {employee.documents.length === 0 ? (
        <p className="text-muted mt-4 text-sm">{t('empty')}</p>
      ) : (
        <ul className="divide-line mt-3 divide-y">
          {employee.documents.map((d) => {
            const Icon = d.contentType === 'application/pdf' ? FileText : FileImage;
            return (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <button
                  type="button"
                  onClick={() => openDocument(employee.id, d.id).catch((error: unknown) => toast.error(errorMessage(error)))}
                  className="flex min-w-0 items-center gap-3 text-start"
                >
                  <span className="bg-canvas text-brand flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span dir="auto" className="text-ink block truncate text-sm font-bold hover:underline">
                      {d.title}
                    </span>
                    <span className="text-muted block truncate text-xs">
                      <span dir="auto">{d.name ?? ''}</span> · {size(d.size)}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={t('remove')}
                  onClick={() => setRemoving(d)}
                  className="text-muted hover:text-danger hover:bg-danger-soft shrink-0 rounded-lg p-1.5 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={removing !== null}
        title={t('removeTitle')}
        description={removing ? t('removeDescription', { title: removing.title }) : ''}
        cancelLabel={t('keep')}
        confirmLabel={t('removeConfirm')}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          const target = removing;
          setRemoving(null);
          if (!target) return;
          remove.mutate(
            { id: employee.id, documentId: target.id },
            { onSuccess: () => toast.success(t('removed')), onError: (error) => toast.error(errorMessage(error)) },
          );
        }}
      />
    </section>
  );
}
