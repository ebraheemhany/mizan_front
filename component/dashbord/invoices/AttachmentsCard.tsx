// components/invoices/AttachmentsCard.tsx
'use client';

import { useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/jpeg'];

export default function AttachmentsCard() {
  const t = useTranslations('InvoiceDetail.attachments');
  const format = useFormatter();

  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<'type' | 'size' | null>(null);
  const [dragging, setDragging] = useState(false);

  const n = (v: number) =>
    format.number(v, { maximumFractionDigits: 1, numberingSystem: 'latn' });
  const sizeLabel = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${n(Math.max(1, Math.round(bytes / 1024)))} KB`
      : `${n(bytes / 1024 / 1024)} MB`;

  // TODO: رفع الملفات للـ API
  function addFiles(list: FileList | null) {
    if (!list) return;

    let nextError: 'type' | 'size' | null = null;
    const accepted: File[] = [];

    for (const file of Array.from(list)) {
      if (!ALLOWED.includes(file.type)) nextError = 'type';
      else if (file.size > MAX_SIZE) nextError = 'size';
      else accepted.push(file);
    }

    setError(nextError);
    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
  }

  return (
    <section className="rounded-card border-line bg-surface border p-6 shadow-sm">
      <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          'border-line-strong text-muted has-[:focus-visible]:ring-brand/30 mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center text-xs transition-colors has-[:focus-visible]:ring-2',
          dragging ? 'border-brand bg-brand-soft/60' : 'hover:bg-canvas/60',
        )}
      >
        <Upload className="size-5" />
        {t('drop')}
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </label>

      {error && (
        <p role="alert" className="text-danger mt-2 text-xs font-semibold">
          {t(`errors.${error}`)}
        </p>
      )}

      {files.length > 0 && (
        <ul className="divide-line mt-4 divide-y">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 py-3 text-sm"
            >
              <span className="bg-brand-soft text-brand-deep flex size-9 shrink-0 items-center justify-center rounded-lg">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p dir="auto" className="text-ink truncate font-bold">
                  {file.name}
                </p>
                <p className="text-muted text-xs tabular-nums">
                  {sizeLabel(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFiles((prev) => prev.filter((_, idx) => idx !== i))
                }
                aria-label={t('remove', { name: file.name })}
                className="text-muted hover:bg-canvas hover:text-danger rounded-md p-1.5"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
