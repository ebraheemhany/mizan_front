// lib/validations/deal.ts
import { z } from 'zod';
import { OPEN_STAGES, type Deal } from '@/lib/deals/model';
import { parseNumber } from './invoice';

// A deal is won by moving it on the board, so "won" isn't offered in the form.
export { OPEN_STAGES };

type DealMessages = {
  titleRequired: string;
  titleMax: string;
  customerRequired: string;
  valueInvalid: string;
  dateRequired: string;
  notesMax: string;
};

export const createDealSchema = (m: DealMessages) =>
  z.object({
    title: z.string().trim().min(1, m.titleRequired).max(80, m.titleMax),
    customerId: z.string().min(1, m.customerRequired),
    value: z
      .string()
      .trim()
      .refine((v) => {
        const n = parseNumber(v);
        return v !== '' && Number.isFinite(n) && n > 0 && /^\d{1,12}(\.\d{1,2})?$/.test(v.replace(/[,\s]/g, ''));
      }, m.valueInvalid),
    stage: z.enum(OPEN_STAGES),
    // '' = nobody yet.
    ownerId: z.string(),
    closeDate: z.string().min(1, m.dateRequired),
    // '' = no follow-up planned.
    followUpDate: z.string(),
    awaitingReply: z.boolean(),
    notes: z.string().max(500, m.notesMax),
  });

export type DealFormValues = z.infer<ReturnType<typeof createDealSchema>>;

/** A deal's current values in the form. */
export function dealToFormValues(d: Deal): DealFormValues {
  const stage = (OPEN_STAGES as readonly string[]).includes(d.stage)
    ? (d.stage as DealFormValues['stage'])
    : 'lead';
  return {
    title: d.title,
    customerId: d.customerId,
    value: String(d.value),
    stage,
    ownerId: d.ownerId ?? '',
    closeDate: d.closeDate,
    followUpDate: d.followUpDate ?? '',
    awaitingReply: d.awaitingReply,
    notes: d.notes ?? '',
  };
}
