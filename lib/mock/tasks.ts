// lib/mock/tasks.ts
// بيانات وهمية لصفحة المهام والتقويم
// TODO: تتربط بالـ API لما الباك إند يجهز

export type TaskPriority = 'urgent' | 'important' | 'normal'

// النوع بيحدد لون الشارة في التقويم (خطوة 3)
export type TaskKind =
  | 'meeting'
  | 'quote'
  | 'collection'
  | 'visit'
  | 'deadline'
  | 'admin'

export type TaskLink = {
  type: 'customer' | 'deal'
  name: string
}

export type Task = {
  id: string
  title: string
  due: string // YYYY-MM-DD
  priority: TaskPriority
  kind: TaskKind
  done: boolean
  completedAt?: string // YYYY-MM-DD
  link?: TaskLink
}

// تاريخ "النهارده" زي اللقطة
// TODO: نستبدله بتاريخ حقيقي لما نربط الـ API
export const TASKS_TODAY = '2026-10-13'

export const mockTasks: Task[] = [
  // متأخرة
  { id: 'k1', title: 'اجتماع مع عميل', due: '2026-10-06', priority: 'normal', kind: 'meeting', done: false, link: { type: 'customer', name: 'عيادة الشفاء' } },
  { id: 'k2', title: 'متابعة عرض السعر', due: '2026-10-09', priority: 'important', kind: 'quote', done: false, link: { type: 'customer', name: 'أكاديمية المستقبل' } },

  // مفتوحة
  { id: 'k3', title: 'تحصيل فاتورة #1038 من شركة النيل', due: '2026-10-13', priority: 'urgent', kind: 'collection', done: false, link: { type: 'customer', name: 'شركة النيل للتجارة' } },
  { id: 'k4', title: 'إرسال عرض سعر لمكتب الأمل', due: '2026-10-14', priority: 'important', kind: 'quote', done: false, link: { type: 'deal', name: 'توريد أجهزة' } },
  { id: 'k5', title: 'مراجعة مصروفات الأسبوع', due: '2026-10-15', priority: 'normal', kind: 'admin', done: false },
  { id: 'k6', title: 'زيارة ميدانية — عيادة الشفاء', due: '2026-10-20', priority: 'normal', kind: 'visit', done: false },
  { id: 'k7', title: 'إقرار ضريبة القيمة المضافة', due: '2026-10-27', priority: 'important', kind: 'deadline', done: false },

  // مكتملة
  { id: 'k8', title: 'تسجيل دفعة أكاديمية المستقبل', due: '2026-10-12', priority: 'important', kind: 'collection', done: true, completedAt: '2026-10-12' },
  { id: 'k9', title: 'تجهيز كشف حساب شركة النيل', due: '2026-10-13', priority: 'normal', kind: 'admin', done: true, completedAt: '2026-10-12' },
  { id: 'k10', title: 'مراجعة عرض عيادة الشفاء', due: '2026-10-08', priority: 'normal', kind: 'quote', done: true, completedAt: '2026-10-07' },
  { id: 'k11', title: 'حجز موعد مع المورد', due: '2026-10-05', priority: 'normal', kind: 'meeting', done: true, completedAt: '2026-10-05' },
]