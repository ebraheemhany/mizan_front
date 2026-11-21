// component/dashbord/deals/deal-actions.ts
// What the board's cards can do beyond moving, editing, deleting and losing
// (which the board passes down): set by DealsView for the whole board.
'use client';

import { createContext, useContext } from 'react';
import type { Deal } from '@/lib/deals/model';

export type DealBoardActions = {
  /** Viewers see the board but can't drag or open a card's menu. */
  readOnly: boolean;
  /** A follow-up done now; `awaitingReply`: the customer still has to answer. */
  onTouch?: (deal: Deal, awaitingReply: boolean) => void;
  /** A won deal: start its invoice. */
  onInvoice?: (deal: Deal) => void;
};

const Actions = createContext<DealBoardActions>({ readOnly: false });
export const DealBoardActionsProvider = Actions.Provider;
export const useDealBoardActions = () => useContext(Actions);
