// components/deals/funnel.ts
import { STAGES, type Deal, type DealStage } from '@/lib/mock/deals';

export type FunnelStep = {
  stage: DealStage;
  reached: number;
  /** نسبة الانتقال من المرحلة السابقة (null للمرحلة الأولى أو لو اللي قبلها صفر) */
  rate: number | null;
  /** عرض الشريط كنسبة من أول مرحلة */
  widthPct: number;
};

export function buildFunnel(deals: Deal[]): FunnelStep[] {
  const order = STAGES.map((s) => s.key);

  // الصفقة اللي في مرحلة معينة بنعتبرها وصلت لكل المراحل اللي قبلها
  const reached = order.map((_, i) => deals.filter((d) => order.indexOf(d.stage) >= i).length);

  return order.map((stage, i) => ({
    stage,
    reached: reached[i],
    rate: i === 0 || reached[i - 1] === 0 ? null : reached[i] / reached[i - 1],
    widthPct: reached[0] ? (reached[i] / reached[0]) * 100 : 0,
  }));
}

export function previousStage(stage: DealStage): DealStage {
  const i = STAGES.findIndex((s) => s.key === stage);
  return STAGES[Math.max(0, i - 1)].key;
}