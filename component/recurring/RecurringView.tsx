// components/recurring/RecurringView.tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

import ConfirmDialog from '@/component/ConfirmDialog';
import PageHeader from '@/component/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import {
  useDeleteRecurring,
  useRecurringAction,
  useRecurringList,
  type Recurring,
  type RecurringStatus,
} from '@/lib/recurring/hooks';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { cn } from '@/lib/utils';
import FilterTabs from '../dashbord/FilterTabs';
import RecurringStats from './RecurringStats';
import RecurringTable from './RecurringTable';

type StatusFilter = 'all' | RecurringStatus;

const TAB_KEYS: StatusFilter[] = ['all', 'active', 'paused', 'ended'];

const outlineBtn = 'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold';
const primaryBtn = 'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

export default function RecurringView() {
  const t = useTranslations('Recurring');
  const tApi = useTranslations('RecurringApi');
  const errorMessage = useApiErrorMessage();
  const user = useSession();
  const canEdit = can(user.role, 'issueInvoices');

  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const q = useDebouncedValue(query.trim(), 300);
  const listQuery = useRecurringList({ status, q });
  const action = useRecurringAction();
  const deleteRecurring = useDeleteRecurring();
  const [deleteTarget, setDeleteTarget] = useState<Recurring | null>(null);

  const data = listQuery.data;
  const tabs = useMemo(
    () => TAB_KEYS.map((key) => ({ value: key, label: t(`tabs.${key}`), count: data?.counts[key] ?? 0 })),
    [t, data],
  );

  async function toggle(row: Recurring) {
    if (row.status === 'ended') return;
    const next = row.status === 'active' ? 'pause' : 'resume';
    try {
      const template = await action.mutateAsync({ id: row.id, action: next });
      // Resuming on a scheduled day makes that day's invoice right away.
      const made = template.generatedCount > row.generatedCount ? template.lastInvoice : null;
      toast.success(
        made
          ? tApi('resumedAndMade', { number: made.displayNumber })
          : template.status === 'ended'
            ? tApi('resumedEnded')
            : t(next === 'pause' ? 'toasts.paused' : 'toasts.resumed'),
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteRecurring.mutateAsync(target.id);
      toast.success(t('toasts.deleted'));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={data ? t('summary', { count: data.counts.all }) : undefined}
        actions={
          <>
            <Link href="/invoices" className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t('back')}
            </Link>
            {canEdit && (
              <Link href="/invoices/recurring/new" className={cn(buttonVariants(), primaryBtn)}>
                <Plus className="size-4" />
                {t('new')}
              </Link>
            )}
          </>
        }
      />

      <RecurringStats stats={data?.stats} />

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
              maxLength={100}
              className="rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-brand/20 h-10 pe-9 text-sm"
            />
          </div>
        </div>

        {listQuery.isPending ? (
          <div className="border-line text-muted flex justify-center border-t px-4 py-14">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : listQuery.isError && !data ? (
          <div className="border-line flex flex-col items-center gap-3 border-t px-4 py-14 text-center">
            <p className="text-danger text-sm font-semibold">{errorMessage(listQuery.error)}</p>
            <Button variant="outline" className={outlineBtn} onClick={() => listQuery.refetch()}>
              {tApi('retry')}
            </Button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="border-line text-muted border-t px-4 py-14 text-center text-sm">
            {status === 'all' && !q && data?.counts.all === 0 ? tApi('emptyAll') : t('empty')}
          </div>
        ) : (
          <div className={listQuery.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
            <RecurringTable
              rows={data.items}
              today={data.today}
              canEdit={canEdit}
              onToggle={toggle}
              onDelete={setDeleteTarget}
            />
          </div>
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
