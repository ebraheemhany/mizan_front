// lib/validations/deal.ts
import { z } from 'zod';
import { parseNumber } from './invoice';
import { CUSTOMERS } from '@/lib/mock/customers';
import type { Deal } from '@/lib/mock/deals';
// الصفقة بتتقفل بالسحب بس، فمرحلة "تم الإغلاق" مش متاحة في النموذج
export const OPEN_STAGES = ['lead', 'contacted', 'proposal', 'negotiation'] as const;

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
    value: z.string().trim().refine((v) => {
      const n = parseNumber(v);
      return v !== '' && Number.isFinite(n) && n > 0;
    }, m.valueInvalid),
    stage: z.enum(OPEN_STAGES),
    ownerId: z.string().min(1),
    closeDate: z.string().min(1, m.dateRequired),
    notes: z.string().max(500, m.notesMax),
  });

export type DealFormValues = z.infer<ReturnType<typeof createDealSchema>>;




export type DealSubmitValues = DealFormValues & { customerName: string };

// بيحوّل الصفقة لقيم النموذج
export function dealToFormValues(d: Deal): DealFormValues {
  const stage = (OPEN_STAGES as readonly string[]).includes(d.stage)
    ? (d.stage as DealFormValues['stage'])
    : 'lead';

  return {
    title: d.title,
    customerId: d.customerId ?? CUSTOMERS.find((c) => c.name === d.customer)?.id ?? '',
    value: String(d.value),
    stage,
    ownerId: d.ownerId,
    closeDate: d.closeDate,
    notes: d.notes ?? '',
  };
}

// بيطبّق قيم النموذج على الصفقة ويسيب باقي بياناتها زي ما هي
export function applyDealForm(d: Deal, v: DealSubmitValues): Deal {
  const moved = v.stage !== d.stage;

  return {
    ...d,
    title: v.title,
    customer: v.customerName,
    customerId: v.customerId,
    value: parseNumber(v.value),
    stage: v.stage,
    ownerId: v.ownerId,
    closeDate: v.closeDate,
    notes: v.notes.trim() || undefined,
    // تغيير المرحلة من النموذج بيتحسب نشاط زي السحب
    ...(moved ? { lastActivityDaysAgo: 0, awaitingReply: false } : {}),
  };
}

