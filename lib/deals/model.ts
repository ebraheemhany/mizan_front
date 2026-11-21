// lib/deals/model.ts
// The pipeline's rules on the frontend: stages and their win odds, what needs
// attention, what counts as closed this month. "Today" and the stale threshold
// come from the server (Cairo business date) through DealsClock.
'use client';

import { createContext, useContext } from 'react';

export type DealStage = 'lead' | 'contacted' | 'proposal' | 'negotiation' | 'won';

export const LOSS_REASONS = ['price', 'competitor', 'postponed', 'noResponse', 'noNeed', 'other'] as const;
export type LossReason = (typeof LOSS_REASONS)[number];

export type Deal = {
  id: string;
  title: string;
  customerId: string;
  customer: string;
  value: number;
  /** A lost deal keeps the stage it was lost at. */
  stage: DealStage;
  ownerId: string | null;
  owner: string | null;
  /** Expected close date; for a won deal, the day it was won. */
  closeDate: string;
  lastActivityDaysAgo: number;
  awaitingReply: boolean;
  followUpDate: string | null;
  notes: string | null;
  wonAt: string | null;
  /** Tasks about it that are still open. */
  openTasks: number;
  lost: { reason: LossReason; note: string | null; date: string } | null;
};

export type LostDeal = Deal & { lost: NonNullable<Deal['lost']> };
export const isLost = (d: Deal): d is LostDeal => d.lost !== null;

/** Each stage's chance of closing: what "expected" is worked out from. */
export const STAGES: { key: DealStage; probability: number; dot: string }[] = [
  { key: 'lead', probability: 0.2, dot: 'bg-muted' },
  { key: 'contacted', probability: 0.4, dot: 'bg-info' },
  { key: 'proposal', probability: 0.6, dot: 'bg-amber-500' },
  { key: 'negotiation', probability: 0.8, dot: 'bg-brand' },
  { key: 'won', probability: 1, dot: 'bg-brand-dark' },
];

/** A deal is won by moving it to "won", never from the form. */
export const OPEN_STAGES = ['lead', 'contacted', 'proposal', 'negotiation'] as const;

export const isOpen = (d: Deal) => d.stage !== 'won' && !d.lost;

export const probabilityOf = (stage: DealStage) => STAGES.find((s) => s.key === stage)?.probability ?? 0;

export const weightedValue = (d: Deal) => d.value * probabilityOf(d.stage);

/** The server's today (Cairo) and how many days without activity make a deal stale. */
export type DealsClock = { today: string; staleDays: number };
const ClockContext = createContext<DealsClock>({ today: '', staleDays: 5 });
export const DealsClockProvider = ClockContext.Provider;
export const useDealsClock = () => useContext(ClockContext);

export type DealTag = { kind: 'followUpToday' } | { kind: 'awaiting' | 'stale'; days: number };

/** The tag on a card, by priority: follow up today, then waiting for a reply, then gone quiet. */
export function getDealTag(d: Deal, clock: DealsClock): DealTag | null {
  if (!isOpen(d)) return null;
  if (d.followUpDate && d.followUpDate <= clock.today) return { kind: 'followUpToday' };
  if (d.awaitingReply) return { kind: 'awaiting', days: d.lastActivityDaysAgo };
  if (d.lastActivityDaysAgo >= clock.staleDays) return { kind: 'stale', days: d.lastActivityDaysAgo };
  return null;
}

export const needsAttention = (d: Deal, clock: DealsClock) => {
  const tag = getDealTag(d, clock);
  return tag?.kind === 'awaiting' || tag?.kind === 'stale';
};

export const isClosedThisMonth = (d: Deal, clock: DealsClock) =>
  d.stage === 'won' && !d.lost && d.closeDate.slice(0, 7) === clock.today.slice(0, 7);

/** A team member who can be responsible for deals. */
export type Owner = { id: string; name: string };
