// components/deals/DealsView.tsx
'use client';

import { useMemo, useState } from 'react';
import { Clock, Plus, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import ConfirmDialog from '@/component/ConfirmDialog';
import PageHeader from '@/component/PageHeader';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { OWNERS, type Owner } from '@/lib/mock/customers';
import {
  DEALS,
  needsAttention,
  TODAY,
  type Deal,
  type DealStage,
  type LossReason,
} from '@/lib/mock/deals';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { parseNumber } from '@/lib/validations/invoice';
import { applyDealForm } from '@/lib/validations/deal';
import AddDealSheet, { type DealSubmit } from './AddDealSheet';
import DealsBoard from './DealsBoard';
import DealsStats from './DealsStats';
import FilterPopover, { type Option } from '../FilterPopover';
import FunnelCard from './FunnelCard';
import LoseDealDialog from './LoseDealDialog';
import LostDealsCard from './LostDealsCard';

const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

export default function DealsView() {
  const t = useTranslations('Deals');
  const router = useRouter();
  const money = useMoney();

  // TODO: لما نربط الـ API الصفقات دي بتيجي من الباك إند
  const [deals, setDeals] = useState<Deal[]>(DEALS);
  const [owners, setOwners] = useState<Owner[]>(OWNERS);
  const [owner, setOwner] = useState('all');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Deal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const [loseTarget, setLoseTarget] = useState<Deal | null>(null);

  const filtered = useMemo(
    () =>
      deals.filter((d) => {
        if (owner !== 'all' && d.ownerId !== owner) return false;
        if (attentionOnly && !needsAttention(d)) return false;
        return true;
      }),
    [deals, owner, attentionOnly],
  );

  // اللوحة بتعرض المفتوحة والمغلقة بس، والخاسرة ليها كارت لوحدها
  const boardDeals = useMemo(() => filtered.filter((d) => !d.lost), [filtered]);

  const ownerOptions: Option[] = [
    { value: 'all', label: t('filters.ownerAll') },
    ...owners.map((o) => ({ value: o.id, label: o.name })),
  ];

  const hasFilters = owner !== 'all' || attentionOnly;

  function addDeal(input: DealSubmit) {
    const deal: Deal = {
      id: `d-new-${Date.now()}`,
      title: input.title,
      customer: input.customerName,
      value: parseNumber(input.value),
      stage: input.stage,
      ownerId: input.ownerId,
      closeDate: input.closeDate,
      lastActivityDaysAgo: 0,
      notes: input.notes.trim() || undefined,
    };

    // TODO: POST /deals لما نربط الـ API
    setDeals((list) => [deal, ...list]);

    // نرجّع الفلاتر علشان الصفقة الجديدة تظهر في اللوحة
    setOwner('all');
    setAttentionOnly(false);

    setAddOpen(false);
    toast.success(t('toasts.added', { title: input.title }));
  }

  function editDeal(input: DealSubmit, target: Deal) {
    const edited = applyDealForm(target, input);
    const updated =
      target.stage === 'won'
        ? {
            ...edited,
            stage: 'won' as const,
            lastActivityDaysAgo: target.lastActivityDaysAgo,
            awaitingReply: target.awaitingReply,
          }
        : edited;
    setDeals((list) => list.map((deal) => (deal.id === target.id ? updated : deal)));
    setEditTarget(null);
    toast.success(t('toasts.updated', { title: updated.title }));
  }

  function deleteDeal() {
    if (!deleteTarget) return;

    const target = deleteTarget;
    const index = deals.findIndex((deal) => deal.id === target.id);
    if (index === -1) {
      setDeleteTarget(null);
      return;
    }

    setDeals((list) => list.filter((deal) => deal.id !== target.id));
    setDeleteTarget(null);

    toast.success(t('toasts.deleted', { title: target.title }), {
      action: {
        label: t('toasts.undo'),
        onClick: () =>
          setDeals((list) =>
            list.some((deal) => deal.id === target.id)
              ? list
              : [
                  ...list.slice(0, Math.min(index, list.length)),
                  target,
                  ...list.slice(Math.min(index, list.length)),
                ],
          ),
      },
    });
  }

  function addOwner(name: string) {
    const existing = owners.find(
      (owner) => owner.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    if (existing) return existing;

    const owner = { id: `o-new-${crypto.randomUUID()}`, name };
    setOwners((list) => [...list, owner]);
    return owner;
  }

  function moveDeal(id: string, stage: DealStage) {
    const prev = deals.find((d) => d.id === id);
    if (!prev || prev.stage === 'won' || prev.lost) return;

    // النقل بيتحسب نشاط: بيصفّر عدّاد المتابعة، وبيلغي "بانتظار الرد"
    const next: Deal = {
      ...prev,
      stage,
      lastActivityDaysAgo: 0,
      awaitingReply: false,
      ...(stage === 'won' ? { closeDate: TODAY } : {}),
    };

    // TODO: PATCH /deals/:id لما نربط الـ API
    setDeals((list) => list.map((d) => (d.id === id ? next : d)));

    const undo = () =>
      setDeals((list) => list.map((d) => (d.id === id ? prev : d)));

    if (stage === 'won') {
      toast.success(
        t('toasts.won', { title: prev.title, amount: money(prev.value) }),
        {
          duration: 8000,
          action: {
            label: t('toasts.createInvoice'),
            onClick: () => router.push('/invoices/new'),
          },
          cancel: { label: t('toasts.undo'), onClick: undo },
        },
      );
    } else {
      toast.success(
        t('toasts.moved', { title: prev.title, stage: t(`stages.${stage}`) }),
        {
          action: { label: t('toasts.undo'), onClick: undo },
        },
      );
    }
  }

  function loseDeal(reason: LossReason, note: string) {
    if (!loseTarget) return;

    const prev = deals.find((d) => d.id === loseTarget.id);
    if (!prev) return;

    // TODO: PATCH /deals/:id/lost لما نربط الـ API
    setDeals((list) =>
      list.map((d) =>
        d.id === prev.id
          ? { ...d, lost: { reason, note: note || undefined, date: TODAY } }
          : d,
      ),
    );

    setLoseTarget(null);
    toast.success(t('lost.toasts.lost', { title: prev.title }), {
      action: {
        label: t('lost.toasts.undo'),
        onClick: () =>
          setDeals((list) => list.map((d) => (d.id === prev.id ? prev : d))),
      },
    });
  }

  function reopenDeal(deal: Deal) {
    // إعادة الفتح بتتحسب نشاط، فالصفقة ما تظهرش "بلا متابعة" على طول
    setDeals((list) =>
      list.map((d) =>
        d.id === deal.id
          ? { ...d, lost: undefined, lastActivityDaysAgo: 0 }
          : d,
      ),
    );

    toast.success(t('lost.toasts.reopened', { title: deal.title }), {
      action: {
        label: t('lost.toasts.undo'),
        onClick: () =>
          setDeals((list) => list.map((d) => (d.id === deal.id ? deal : d))),
      },
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          <>
            {hasFilters && (
              <Button
                variant="ghost"
                onClick={() => {
                  setOwner('all');
                  setAttentionOnly(false);
                }}
                className="text-danger hover:bg-danger-soft hover:text-danger h-10 gap-1.5 px-3 text-xs font-bold"
              >
                <X className="size-3.5" />
                {t('filters.clear')}
              </Button>
            )}

            <FilterPopover
              icon={Users}
              label={t('filters.owner')}
              value={owner}
              allValue="all"
              options={ownerOptions}
              onChange={setOwner}
            />

            <button
              type="button"
              aria-pressed={attentionOnly}
              onClick={() => setAttentionOnly((v) => !v)}
              className={cn(
                'rounded-btn inline-flex h-10 items-center gap-2 border px-3.5 text-xs font-semibold transition-colors',
                attentionOnly
                  ? 'border-amber-300 bg-amber-100 text-amber-800'
                  : 'border-line-strong bg-surface text-ink-2 hover:bg-canvas',
              )}
            >
              <Clock className="size-4" />
              {t('filters.attention')}
            </button>

            <Button className={primaryBtn} onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              {t('new')}
            </Button>
          </>
        }
      />

      <DealsStats deals={filtered} />

      <DealsBoard
        deals={boardDeals}
        owners={owners}
        onMove={moveDeal}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
        onLose={setLoseTarget}
      />

      <FunnelCard deals={filtered} />

      <LostDealsCard deals={filtered} onReopen={reopenDeal} />

      <AddDealSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={addDeal}
        owners={owners}
        onAddOwner={addOwner}
      />

      <AddDealSheet
        deal={editTarget ?? undefined}
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onSubmit={(input, deal) => {
          if (deal) editDeal(input, deal);
        }}
        owners={owners}
        onAddOwner={addOwner}
      />

      {deleteTarget && (
        <ConfirmDialog
          open
          title={t('deleteDialog.title', { title: deleteTarget.title })}
          description={t('deleteDialog.description')}
          cancelLabel={t('deleteDialog.keep')}
          confirmLabel={t('deleteDialog.confirm')}
          onConfirm={deleteDeal}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <LoseDealDialog
        deal={loseTarget}
        onConfirm={loseDeal}
        onClose={() => setLoseTarget(null)}
      />
    </div>
  );
}
