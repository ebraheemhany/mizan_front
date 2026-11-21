// components/deals/DealsView.tsx
'use client';

import { useMemo, useState } from 'react';
import { Clock, Loader2, Plus, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import ConfirmDialog from '@/component/ConfirmDialog';
import PageHeader from '@/component/PageHeader';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { useTeamDirectory } from '@/lib/customers/hooks';
import {
  useDeals,
  useDeleteDeal,
  useLoseDeal,
  useMoveDeal,
  useReopenDeal,
  useSaveDeal,
  useTouchDeal,
  type DealInput,
} from '@/lib/deals/hooks';
import { DealsClockProvider, needsAttention, type Deal, type DealStage, type LossReason } from '@/lib/deals/model';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import AddDealSheet, { type DealSubmit } from './AddDealSheet';
import { DealBoardActionsProvider } from './deal-actions';
import DealsBoard from './DealsBoard';
import DealsStats from './DealsStats';
import FilterPopover, { type Option } from '../FilterPopover';
import FunnelCard from './FunnelCard';
import LoseDealDialog from './LoseDealDialog';
import LostDealsCard from './LostDealsCard';

const primaryBtn = 'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

/** The form's values as the API takes them. */
function toInput(v: DealSubmit, deal?: Deal): DealInput {
  return {
    title: v.title.trim(),
    customerId: v.customerId,
    value: v.value.replace(/[,\s]/g, ''),
    // A won deal keeps its stage (the form doesn't show it).
    ...(deal?.stage === 'won' ? {} : { stage: v.stage }),
    ownerId: v.ownerId || null,
    closeDate: v.closeDate,
    followUpDate: v.followUpDate || null,
    awaitingReply: v.awaitingReply,
    notes: v.notes,
  };
}

/** A won deal's invoice: its customer and one line with its title and value. */
export function invoiceHref(deal: Deal) {
  const query = new URLSearchParams({
    customer: deal.customerId,
    customerName: deal.customer,
    item: deal.title,
    price: deal.value.toFixed(2),
  });
  return `/invoices/new?${query}`;
}

export default function DealsView() {
  const t = useTranslations('Deals');
  const router = useRouter();
  const money = useMoney();
  const errorMessage = useApiErrorMessage();
  const user = useSession();
  const readOnly = !can(user.role, 'deals');

  const board = useDeals();
  const team = useTeamDirectory();
  const saveDeal = useSaveDeal();
  const moveMutation = useMoveDeal();
  const loseMutation = useLoseDeal();
  const reopenMutation = useReopenDeal();
  const touchMutation = useTouchDeal();
  const deleteMutation = useDeleteDeal();

  const [owner, setOwner] = useState('all');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Deal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const [loseTarget, setLoseTarget] = useState<Deal | null>(null);

  const clock = useMemo(
    () => ({ today: board.data?.today ?? '', staleDays: board.data?.staleDays ?? 5 }),
    [board.data?.today, board.data?.staleDays],
  );
  const deals = useMemo(() => board.data?.deals ?? [], [board.data?.deals]);

  const filtered = useMemo(
    () =>
      deals.filter((d) => {
        if (owner === 'none' ? d.ownerId !== null : owner !== 'all' && d.ownerId !== owner) return false;
        if (attentionOnly && !needsAttention(d, clock)) return false;
        return true;
      }),
    [deals, owner, attentionOnly, clock],
  );

  // The board shows open and won deals; lost ones have their own card.
  const boardDeals = useMemo(() => filtered.filter((d) => !d.lost), [filtered]);

  const ownerOptions: Option[] = [
    { value: 'all', label: t('filters.ownerAll') },
    ...(team.data ?? []).map((o) => ({ value: o.id, label: o.name })),
    { value: 'none', label: t('filters.ownerNone') },
  ];
  const hasFilters = owner !== 'all' || attentionOnly;
  const failed = (error: unknown) => toast.error(errorMessage(error));

  async function saveFromSheet(values: DealSubmit, deal?: Deal) {
    try {
      const saved = await saveDeal.mutateAsync({ id: deal?.id, input: toInput(values, deal) });
      if (deal) {
        setEditTarget(null);
        toast.success(t('toasts.updated', { title: saved.title }));
      } else {
        // Clear the filters so the new deal shows on the board.
        setOwner('all');
        setAttentionOnly(false);
        setAddOpen(false);
        toast.success(t('toasts.added', { title: saved.title }));
      }
      return true;
    } catch (error) {
      failed(error);
      return false;
    }
  }

  function moveDeal(id: string, stage: DealStage) {
    const prev = deals.find((d) => d.id === id);
    if (!prev || prev.lost || prev.stage === stage) return;
    const undo = () => moveMutation.mutate({ id, stage: prev.stage }, { onError: failed });

    moveMutation.mutate(
      { id, stage },
      {
        onError: failed,
        onSuccess: (moved) => {
          if (stage === 'won') {
            toast.success(t('toasts.won', { title: prev.title, amount: money(prev.value) }), {
              duration: 8000,
              action: { label: t('toasts.createInvoice'), onClick: () => router.push(invoiceHref(moved)) },
              cancel: { label: t('toasts.undo'), onClick: undo },
            });
          } else {
            toast.success(t('toasts.moved', { title: prev.title, stage: t(`stages.${stage}`) }), {
              action: { label: t('toasts.undo'), onClick: undo },
            });
          }
        },
      },
    );
  }

  function loseDeal(reason: LossReason, note: string) {
    if (!loseTarget) return;
    const deal = loseTarget;
    setLoseTarget(null);
    loseMutation.mutate(
      { id: deal.id, reason, note },
      {
        onError: failed,
        onSuccess: () =>
          toast.success(t('lost.toasts.lost', { title: deal.title }), {
            action: {
              label: t('lost.toasts.undo'),
              onClick: () => reopenMutation.mutate(deal.id, { onError: failed }),
            },
          }),
      },
    );
  }

  function reopenDeal(deal: Deal) {
    const lost = deal.lost;
    reopenMutation.mutate(deal.id, {
      onError: failed,
      onSuccess: () =>
        toast.success(t('lost.toasts.reopened', { title: deal.title }), {
          action: lost
            ? {
                label: t('lost.toasts.undo'),
                onClick: () =>
                  loseMutation.mutate({ id: deal.id, reason: lost.reason, note: lost.note ?? '' }, { onError: failed }),
              }
            : undefined,
        }),
    });
  }

  function touchDeal(deal: Deal, awaitingReply: boolean) {
    touchMutation.mutate(
      { id: deal.id, awaitingReply },
      {
        onError: failed,
        onSuccess: () => toast.success(t(awaitingReply ? 'toasts.awaiting' : 'toasts.followedUp', { title: deal.title })),
      },
    );
  }

  function deleteDeal() {
    if (!deleteTarget) return;
    const deal = deleteTarget;
    setDeleteTarget(null);
    deleteMutation.mutate(deal.id, {
      onError: failed,
      onSuccess: () => toast.success(t('toasts.deleted', { title: deal.title })),
    });
  }

  if (board.isPending) {
    return (
      <div className="text-muted flex justify-center py-20">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (board.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <p className="text-danger text-sm font-semibold">{errorMessage(board.error)}</p>
        <Button variant="outline" onClick={() => board.refetch()} className="rounded-btn h-10 text-xs font-bold">
          {t('retry')}
        </Button>
      </div>
    );
  }

  return (
    <DealsClockProvider value={clock}>
      <DealBoardActionsProvider
        value={{ readOnly, onTouch: touchDeal, onInvoice: (deal) => router.push(invoiceHref(deal)) }}
      >
        <div className="space-y-5">
          <PageHeader
            title={t('title')}
            description={readOnly ? t('subtitleReadOnly') : t('subtitle')}
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

                {!readOnly && (
                  <Button className={primaryBtn} onClick={() => setAddOpen(true)}>
                    <Plus className="size-4" />
                    {t('new')}
                  </Button>
                )}
              </>
            }
          />

          <DealsStats deals={filtered} />

          <DealsBoard
            deals={boardDeals}
            onMove={moveDeal}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
            onLose={setLoseTarget}
          />

          <FunnelCard deals={filtered} />

          <LostDealsCard deals={filtered} onReopen={reopenDeal} />

          <AddDealSheet open={addOpen} onOpenChange={setAddOpen} onSubmit={saveFromSheet} />

          <AddDealSheet
            deal={editTarget ?? undefined}
            open={editTarget !== null}
            onOpenChange={(open) => {
              if (!open) setEditTarget(null);
            }}
            onSubmit={saveFromSheet}
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

          <LoseDealDialog deal={loseTarget} onConfirm={loseDeal} onClose={() => setLoseTarget(null)} />
        </div>
      </DealBoardActionsProvider>
    </DealsClockProvider>
  );
}
