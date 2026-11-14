// components/recurring/RecurringView.tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/component/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import {
  RECURRING,
  type RecurringInvoice,
  type RecurringStatus,
} from '@/lib/mock/recurring';
import { cn } from '@/lib/utils';
import RecurringStats from './RecurringStats';
import RecurringTable from './RecurringTable';
import FilterTabs from '../dashbord/FilterTabs';
import ConfirmDialog from '@/component/ConfirmDialog';
type StatusFilter = 'all' | RecurringStatus;

const TAB_KEYS: StatusFilter[] = ['all', 'active', 'paused', 'ended'];

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold';
const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

export default function RecurringView() {
  const t = useTranslations('Recurring');

  // TODO: لما نربط الـ API القوالب دي بتيجي من الباك إند
  const [items, setItems] = useState(RECURRING);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<RecurringInvoice | null>(
    null,
  );
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((i) => {
      if (status !== 'all' && i.status !== status) return false;
      if (
        q &&
        !i.name.toLowerCase().includes(q) &&
        !i.customer.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [items, status, query]);

  const tabs = useMemo(
    () =>
      TAB_KEYS.map((key) => ({
        value: key,
        label: t(`tabs.${key}`),
        count:
          key === 'all'
            ? items.length
            : items.filter((i) => i.status === key).length,
      })),
    [t, items],
  );

  function toggle(id: string) {
    const target = items.find((i) => i.id === id);
    if (!target || target.status === 'ended') return;

    const next: RecurringStatus =
      target.status === 'active' ? 'paused' : 'active';
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: next } : i)),
    );
    toast.success(t(next === 'paused' ? 'toasts.paused' : 'toasts.resumed'));
  }

  function remove() {
    if (!deleteTarget) return;

    setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success(t('toasts.deleted'));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={t('summary', { count: items.length })}
        actions={
          <>
            <Link
              href="/invoices"
              className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}
            >
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t('back')}
            </Link>
            <Link
              href="/invoices/recurring/new"
              className={cn(buttonVariants(), primaryBtn)}
            >
              <Plus className="size-4" />
              {t('new')}
            </Link>
          </>
        }
      />

      <RecurringStats items={items} />

      <FilterTabs value={status} tabs={tabs} onChange={setStatus} />

      <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
        <div className="p-4">
          <div className="relative">
            <Search className="text-muted pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search')}
              aria-label={t('search')}
              className="rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-brand/20 h-10 pe-9 text-sm"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="border-line text-muted border-t px-4 py-14 text-center text-sm">
            {t('empty')}
          </div>
        ) : (
          <RecurringTable
            rows={rows}
            onToggle={toggle}
            onDelete={setDeleteTarget}
          />
        )}
      </div>
      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('deleteDialog.title', { name: deleteTarget?.name ?? '' })}
        description={t('deleteDialog.description')}
        cancelLabel={t('deleteDialog.keep')}
        confirmLabel={t('deleteDialog.confirm')}
        onConfirm={remove}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
