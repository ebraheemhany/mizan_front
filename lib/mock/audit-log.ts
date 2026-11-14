// lib/mock/audit-log.ts
import { CUSTOMERS } from '@/lib/mock/customers';
import { INVOICES } from '@/lib/mock/invoices';

export type AuditAction =
  | 'create'
  | 'update'
  | 'payment'
  | 'send'
  | 'delete'
  | 'permissions'
  | 'login';

export type AuditItemType = 'invoice' | 'customer' | 'expense' | 'user' | 'account';

export type AuditDetailKey =
  | 'draftInvoice'
  | 'customerPhoneChanged'
  | 'customerUpdated'
  | 'paymentRecorded'
  | 'autoReminder'
  | 'deleteExpense'
  | 'expenseAdded'
  | 'roleChangedAccountant'
  | 'loginNewDevice'
  | 'loginSuccess';

export type AuditEntry = {
  id: string;
  at: string; // ISO (UTC)
  user: string; // id من AUDIT_USERS
  action: AuditAction;
  // id هو معرّف الصفحة (فاتورة/عميل) للينك، وlسه مفيش للمصروف والحساب والمستخدم
  item: { type: AuditItemType; ref?: string; id?: string };
  detail: { key: AuditDetailKey; amount?: number; name?: string };
  ip: string | null;
};

// TODO: المستخدمين من الـ API. "system" اسمه من الترجمة
export const AUDIT_USERS = [
  { id: 'u1', name: 'محمد أحمد', ip: '196.x.x.12' },
  { id: 'u2', name: 'سارة علي', ip: '41.x.x.88' },
  { id: 'u3', name: 'كريم حسن', ip: '41.x.x.31' },
  { id: 'system', name: '', ip: null },
] as const;

// "النهارده" في البيانات الوهمية (يتوحّد مع باقي التواريخ وقت الربط)
export const AUDIT_NOW = '2026-10-13T23:59:59Z';

// أول 7 صفوف زي التصميم، وبتشاور على فواتير وعملاء حقيقيين من lib/mock
const SEED: AuditEntry[] = [
  {
    id: 'a1',
    at: '2026-10-13T11:42:00Z',
    user: 'u1',
    action: 'create',
    item: { type: 'invoice', ref: '1043', id: 'i1043' },
    detail: { key: 'draftInvoice', amount: 16302 },
    ip: '196.x.x.12',
  },
  {
    id: 'a2',
    at: '2026-10-13T10:05:00Z',
    user: 'u2',
    action: 'update',
    item: { type: 'customer', ref: 'مكتب الأمل للاستشارات', id: 'c2' },
    detail: { key: 'customerPhoneChanged' },
    ip: '41.x.x.88',
  },
  {
    id: 'a3',
    at: '2026-10-12T16:20:00Z',
    user: 'u1',
    action: 'payment',
    item: { type: 'invoice', ref: '1042', id: 'i1042' },
    detail: { key: 'paymentRecorded', amount: 12400 },
    ip: '196.x.x.12',
  },
  {
    id: 'a4',
    at: '2026-10-12T10:30:00Z',
    user: 'system',
    action: 'send',
    item: { type: 'invoice', ref: '1038', id: 'i1038' },
    detail: { key: 'autoReminder' },
    ip: null,
  },
  {
    id: 'a5',
    at: '2026-10-11T14:02:00Z',
    user: 'u3',
    action: 'delete',
    item: { type: 'expense' },
    detail: { key: 'deleteExpense', name: 'اشتراك قديم', amount: 300 },
    ip: '41.x.x.31',
  },
  {
    id: 'a6',
    at: '2026-10-10T09:15:00Z',
    user: 'u1',
    action: 'permissions',
    item: { type: 'user', ref: 'كريم حسن' },
    detail: { key: 'roleChangedAccountant' },
    ip: '196.x.x.12',
  },
  {
    id: 'a7',
    at: '2026-10-09T18:40:00Z',
    user: 'u1',
    action: 'login',
    item: { type: 'account' },
    detail: { key: 'loginNewDevice' },
    ip: '196.x.x.12',
  },
];

type Template = Pick<AuditEntry, 'user' | 'action' | 'item' | 'detail'> & {
  withAmount?: boolean;
};

// أول 8 عملاء حقيقيين من lib/mock/customers
const AUDIT_CUSTOMERS = CUSTOMERS.slice(0, 8);

const TEMPLATES: Template[] = [
  { user: 'u1', action: 'create', item: { type: 'invoice' }, detail: { key: 'draftInvoice' }, withAmount: true },
  { user: 'u1', action: 'payment', item: { type: 'invoice' }, detail: { key: 'paymentRecorded' }, withAmount: true },
  { user: 'u2', action: 'update', item: { type: 'customer' }, detail: { key: 'customerUpdated' } },
  { user: 'system', action: 'send', item: { type: 'invoice' }, detail: { key: 'autoReminder' } },
  { user: 'u3', action: 'create', item: { type: 'expense' }, detail: { key: 'expenseAdded' }, withAmount: true },
  { user: 'u2', action: 'login', item: { type: 'account' }, detail: { key: 'loginSuccess' } },
  { user: 'u3', action: 'delete', item: { type: 'expense' }, detail: { key: 'deleteExpense', name: 'مصروف مكرر' }, withAmount: true },
  { user: 'u1', action: 'permissions', item: { type: 'user', ref: 'سارة علي' }, detail: { key: 'roleChangedAccountant' } },
  { user: 'u3', action: 'update', item: { type: 'customer' }, detail: { key: 'customerUpdated' } },
];

const TOTAL = 412;
const BASE = Date.parse('2026-10-09T18:40:00Z');

// توليد ثابت (من غير random) علشان الأرقام ما تتغيرش مع كل refresh
function generate(count: number): AuditEntry[] {
  return Array.from({ length: count }, (_, i) => {
    const tpl = TEMPLATES[i % TEMPLATES.length];
    const user = AUDIT_USERS.find((u) => u.id === tpl.user)!;

    let item: AuditEntry['item'] = { ...tpl.item };

    if (tpl.item.type === 'invoice') {
      // من الفواتير الفعلية علشان اللينك ما يطلعش 404
      const invoice = INVOICES[i % INVOICES.length];
      item = { type: 'invoice', ref: String(invoice.number), id: invoice.id };
    } else if (tpl.item.type === 'customer') {
      const customer = AUDIT_CUSTOMERS[i % AUDIT_CUSTOMERS.length];
      item = { type: 'customer', ref: customer.name, id: customer.id };
    }

    return {
      id: `g${i}`,
      at: new Date(BASE - (i + 1) * 221 * 60_000).toISOString(),
      user: tpl.user,
      action: tpl.action,
      item,
      detail: {
        ...tpl.detail,
        amount: tpl.withAmount ? 1000 + ((i * 7919) % 20000) : undefined,
      },
      ip: user.ip,
    };
  });
}

// TODO: السجل من الـ API (مع ترقيم وفلترة من السيرفر)
export const AUDIT_ENTRIES: AuditEntry[] = [
  ...SEED,
  ...generate(TOTAL - SEED.length),
];