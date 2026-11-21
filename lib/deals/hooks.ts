// lib/deals/hooks.ts
// The sales pipeline (backend /api/deals) as TanStack Query hooks. Moves are
// shown on the board at once (optimistic) and put back if the server refuses.
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import type { Deal, DealStage, LossReason } from './model';

type ApiDeal = Omit<Deal, 'value'> & { value: string };
type ApiList = { today: string; staleDays: number; deals: ApiDeal[] };
export type DealsBoardData = { today: string; staleDays: number; deals: Deal[] };

export const toUiDeal = (d: ApiDeal): Deal => ({ ...d, value: Number(d.value) });

export type DealInput = {
  title: string;
  customerId: string;
  value: string;
  stage?: Exclude<DealStage, 'won'>;
  ownerId: string | null;
  closeDate: string;
  followUpDate: string | null;
  awaitingReply: boolean;
  notes: string;
};

export function useDeals() {
  return useQuery({
    queryKey: queryKeys.deals.list,
    queryFn: async (): Promise<DealsBoardData> => {
      const data = await api<ApiList>('/api/deals');
      return { ...data, deals: data.deals.map(toUiDeal) };
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function useAfterDealChange() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
}

/** Puts a deal in the cached board right away; returns how to undo it if the server refuses. */
function useOptimistic() {
  const queryClient = useQueryClient();
  return async (id: string, change: (d: Deal) => Deal | null) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.deals.list });
    const before = queryClient.getQueryData<DealsBoardData>(queryKeys.deals.list);
    if (before) {
      queryClient.setQueryData<DealsBoardData>(queryKeys.deals.list, {
        ...before,
        deals: before.deals.flatMap((d) => {
          if (d.id !== id) return [d];
          const next = change(d);
          return next ? [next] : [];
        }),
      });
    }
    return () => {
      if (before) queryClient.setQueryData(queryKeys.deals.list, before);
    };
  };
}

export function useSaveDeal() {
  const after = useAfterDealChange();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: DealInput }) =>
      toUiDeal(
        (
          await api<{ deal: ApiDeal }>(id ? `/api/deals/${id}` : '/api/deals', {
            method: id ? 'PATCH' : 'POST',
            body: input,
          })
        ).deal,
      ),
    onSuccess: after,
  });
}

/** Moving on the board (drag and drop, the card's menu, undo). */
export function useMoveDeal() {
  const after = useAfterDealChange();
  const optimistic = useOptimistic();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: DealStage }) =>
      toUiDeal((await api<{ deal: ApiDeal }>(`/api/deals/${id}/move`, { method: 'POST', body: { stage } })).deal),
    onMutate: ({ id, stage }) =>
      optimistic(id, (d) => ({ ...d, stage, lastActivityDaysAgo: 0, awaitingReply: false })),
    onError: (_error, _vars, undo) => undo?.(),
    onSettled: after,
  });
}

export function useLoseDeal() {
  const after = useAfterDealChange();
  return useMutation({
    mutationFn: async ({ id, reason, note }: { id: string; reason: LossReason; note: string }) =>
      toUiDeal(
        (await api<{ deal: ApiDeal }>(`/api/deals/${id}/lose`, { method: 'POST', body: { reason, note } })).deal,
      ),
    onSuccess: after,
  });
}

export function useReopenDeal() {
  const after = useAfterDealChange();
  return useMutation({
    mutationFn: async (id: string) =>
      toUiDeal((await api<{ deal: ApiDeal }>(`/api/deals/${id}/reopen`, { method: 'POST' })).deal),
    onSuccess: after,
  });
}

/** A follow-up done now (and whether the customer still has to answer). */
export function useTouchDeal() {
  const after = useAfterDealChange();
  return useMutation({
    mutationFn: async ({ id, awaitingReply }: { id: string; awaitingReply: boolean }) =>
      toUiDeal(
        (await api<{ deal: ApiDeal }>(`/api/deals/${id}/touch`, { method: 'POST', body: { awaitingReply } })).deal,
      ),
    onSuccess: after,
  });
}

export function useDeleteDeal() {
  const after = useAfterDealChange();
  return useMutation({
    mutationFn: async (id: string) => {
      await api(`/api/deals/${id}`, { method: 'DELETE' });
    },
    onSuccess: after,
  });
}
