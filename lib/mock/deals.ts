// lib/mock/deals.ts
import { MOCK_NOW } from './invoices';

export type DealStage = 'lead' | 'contacted' | 'proposal' | 'negotiation' | 'won';

export const LOSS_REASONS = [
  'price',
  'competitor',
  'postponed',
  'noResponse',
  'noNeed',
  'other',
] as const;
export type LossReason = (typeof LOSS_REASONS)[number];


export type Deal = {
  id: string;
  title: string;
  customer: string;
    customerId?: string;
  value: number;
  stage: DealStage;
  ownerId: string;
  closeDate: string; // yyyy-mm-dd
  lastActivityDaysAgo: number;
  awaitingReply?: boolean;
  followUpDate?: string;
  notes?: string;
  lost?: { reason: LossReason; note?: string; date: string };
   
};
export type LostDeal = Deal & { lost: NonNullable<Deal['lost']> };
export const isLost = (d: Deal): d is LostDeal => Boolean(d.lost);

// probability: احتمال إغلاق الصفقة في كل مرحلة، وهو اللي بيتحسب منه "المتوقع لتحقيقه"
export const STAGES: { key: DealStage; probability: number; dot: string }[] = [
  { key: 'lead', probability: 0.2, dot: 'bg-muted' },
  { key: 'contacted', probability: 0.4, dot: 'bg-info' },
  { key: 'proposal', probability: 0.6, dot: 'bg-amber-500' },
  { key: 'negotiation', probability: 0.8, dot: 'bg-brand' },
  { key: 'won', probability: 1, dot: 'bg-brand-dark' },
];

export const STALE_DAYS = 5;

// TODO: التاريخ الحقيقي لما نربط الـ API
export const TODAY = MOCK_NOW.toISOString().slice(0, 10);

export const isOpen = (d: Deal) => d.stage !== 'won' && !d.lost;

export const probabilityOf = (stage: DealStage) =>
  STAGES.find((s) => s.key === stage)?.probability ?? 0;

export const weightedValue = (d: Deal) => d.value * probabilityOf(d.stage);

export type DealTag = { kind: 'followUpToday' } | { kind: 'awaiting' | 'stale'; days: number };

// الشارة اللي بتظهر على الكارت، بالأولوية: متابعة اليوم ثم انتظار الرد ثم انقطاع المتابعة
export function getDealTag(d: Deal): DealTag | null {
  if (!isOpen(d)) return null;
  if (d.followUpDate === TODAY) return { kind: 'followUpToday' };
  if (d.awaitingReply) return { kind: 'awaiting', days: d.lastActivityDaysAgo };
  if (d.lastActivityDaysAgo >= STALE_DAYS) return { kind: 'stale', days: d.lastActivityDaysAgo };
  return null;
}

export const needsAttention = (d: Deal) => {
  const tag = getDealTag(d);
  return tag?.kind === 'awaiting' || tag?.kind === 'stale';
};

export const isClosedThisMonth = (d: Deal) =>
  d.stage === 'won' && d.closeDate.slice(0, 7) === TODAY.slice(0, 7);

// TODO: الصفقات دي هتيجي من الـ API
export const DEALS: Deal[] = [
  // عميل محتمل
  { id: 'd1', title: 'تطوير موقع تعريفي', customer: 'مطعم السلام', value: 18000, stage: 'lead', ownerId: 'o3', closeDate: '2026-12-10', lastActivityDaysAgo: 2 },
  { id: 'd2', title: 'نظام حجوزات', customer: 'عيادة الشفاء', value: 35000, stage: 'lead', ownerId: 'o2', closeDate: '2026-12-20', lastActivityDaysAgo: 1 },
  { id: 'd3', title: 'تصميم هوية', customer: 'مخبز الصباح', value: 9000, stage: 'lead', ownerId: 'o1', closeDate: '2026-11-25', lastActivityDaysAgo: 0 },
  { id: 'd4', title: 'منصة طلبات', customer: 'بقالة الحي', value: 15000, stage: 'lead', ownerId: 'o3', closeDate: '2026-12-30', lastActivityDaysAgo: 3 },

  // تم التواصل
  { id: 'd5', title: 'حملة إعلانية', customer: 'متجر الأناقة', value: 22000, stage: 'contacted', ownerId: 'o2', closeDate: '2026-11-20', lastActivityDaysAgo: 1 },
  { id: 'd6', title: 'استشارة ضريبية', customer: 'شركة الرواد', value: 12000, stage: 'contacted', ownerId: 'o1', closeDate: '2026-11-12', lastActivityDaysAgo: 2 },
  { id: 'd7', title: 'تطبيق جوال', customer: 'أكاديمية المستقبل', value: 60000, stage: 'contacted', ownerId: 'o3', closeDate: '2026-12-15', lastActivityDaysAgo: 0 },

  // عرض سعر
  { id: 'd8', title: 'عقد صيانة سنوي', customer: 'شركة النيل للتجارة', value: 30000, stage: 'proposal', ownerId: 'o1', closeDate: '2026-11-08', lastActivityDaysAgo: 1 },
  { id: 'd9', title: 'تجهيز مكتب', customer: 'شركة الرواد', value: 27500, stage: 'proposal', ownerId: 'o2', closeDate: '2026-11-05', lastActivityDaysAgo: 3, awaitingReply: true },
  { id: 'd10', title: 'نظام فواتير', customer: 'عيادة الشفاء', value: 15000, stage: 'proposal', ownerId: 'o3', closeDate: '2026-11-15', lastActivityDaysAgo: 2 },

  // تفاوض
  { id: 'd11', title: 'توريد وتركيب نظام', customer: 'شركة النيل للتجارة', value: 45000, stage: 'negotiation', ownerId: 'o1', closeDate: '2026-10-28', lastActivityDaysAgo: 0, followUpDate: TODAY },
  { id: 'd12', title: 'استشارات شهرية', customer: 'مكتب الأمل للاستشارات', value: 45000, stage: 'negotiation', ownerId: 'o2', closeDate: '2026-10-30', lastActivityDaysAgo: 5 },

  // تم الإغلاق
  { id: 'd13', title: 'تركيب نظام مراقبة', customer: 'شركة النيل للتجارة', value: 12400, stage: 'won', ownerId: 'o1', closeDate: '2026-10-09', lastActivityDaysAgo: 4 },
  { id: 'd14', title: 'حملة موسمية', customer: 'مكتب الأمل للاستشارات', value: 18000, stage: 'won', ownerId: 'o2', closeDate: '2026-10-03', lastActivityDaysAgo: 10 },

    // خاسرة
  { id: 'd15', title: 'بوابة دفع إلكتروني', customer: 'متجر الأناقة', value: 40000, stage: 'negotiation', ownerId: 'o1', closeDate: '2026-10-20', lastActivityDaysAgo: 8, lost: { reason: 'price', note: 'طلب خصماً أكبر من المسموح', date: '2026-10-12' } },
  { id: 'd16', title: 'حملة تسويق رقمي', customer: 'مخبز الصباح', value: 16000, stage: 'proposal', ownerId: 'o3', closeDate: '2026-10-10', lastActivityDaysAgo: 15, lost: { reason: 'competitor', date: '2026-10-05' } },
  { id: 'd17', title: 'استشارات إدارية', customer: 'بقالة الحي', value: 9500, stage: 'contacted', ownerId: 'o2', closeDate: '2026-10-01', lastActivityDaysAgo: 21, lost: { reason: 'noResponse', date: '2026-09-28' } },
];