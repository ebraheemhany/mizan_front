// lib/mock/invoice-details.ts
import { INVOICES, type Invoice } from './invoices';

export type InvoiceLine = {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
};




export type Party = {
  name: string;
  taxNumber: string;
  location: string;
  email?: string;
  phone?: string;
  /** The issuer's logo, if the company uploaded one. */
  logoUrl?: string;
};

/** Every method the backend accepts (the payments page records all of them). */
export type InvoicePaymentMethod = 'cash' | 'bank' | 'card' | 'instapay' | 'vodafoneCash' | 'cheque';

export type Payment = {
  id: string;
  /** Receipt number, e.g. PAY-0012. */
  number?: string;
  amount: number;
  date: string;
  method: InvoicePaymentMethod;
  /** pending = a cheque not cleared yet. */
  status?: 'cleared' | 'pending' | 'bounced';
  /** Where the money went in (cash box, bank account, e-wallet). */
  account?: 'bank' | 'cashbox' | 'wallet';
  reference?: string;
  note?: string;
};

export type HistoryEvent = {
  id: string;
type:
    | 'created'
    | 'sent'
    | 'viewed'
    | 'reminder'
    | 'reminderSent'
    | 'emailed'
    | 'payment'
    | 'paymentRemoved'
    | 'chequeBounced'
    | 'cancelled';
  at: string; // yyyy-mm-dd أو ISO كامل لو فيه وقت
  values?: Record<string, string | number>;
  
};

export type InvoiceDetail = Invoice & {
  issuer: Party;
  client: Party;
  lines: InvoiceLine[];
  subtotal: number;
  vatRate: number; // نسبة مئوية
  vat: number;
  rounding: number;
  note: string;
  payments: Payment[];
  history: HistoryEvent[];
};

export const ISSUER: Party = {
  name: 'شركة ميزان للحلول',
  taxNumber: '412-558-903',
  location: 'الجيزة، مصر',
};

const NOTE = 'التحويل البنكي على حساب البنك الأهلي — رقم الحساب في الإعدادات.';
const CITIES = ['القاهرة', 'الجيزة', 'الإسكندرية', 'المنصورة', 'طنطا'];
const VAT_RATE = 14;
const AUTHOR = 'محمد أحمد';

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function clientInfo(name: string): Party {
  if (name === 'شركة النيل للتجارة') {
    return {
      name,
      taxNumber: '377-102-846',
      location: 'القاهرة',
      email: 'accounts@nile.eg',
      phone: '010 1234 5678',
    };
  }
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const part = (k: number) => String(100 + ((sum * k) % 900));
  return {
    name,
    taxNumber: `${part(3)}-${part(7)}-${part(11)}`,
    location: CITIES[sum % CITIES.length],
    email: 'accounts@client.example.com',
    phone: `01${sum % 3} ${String(1000 + ((sum * 5) % 9000))} ${String(1000 + ((sum * 9) % 9000))}`,
  };
}

// بنود الفاتورة #1038 زي التصميم. الباقي بياخد بند واحد بيتحسب من الإجمالي
const SPECIAL_LINES: Record<number, InvoiceLine[]> = {
  1038: [
    { id: 'l1', title: 'دعم فني شهري', description: 'باقة الدعم — سبتمبر 2026', quantity: 1, unitPrice: 6000 },
    { id: 'l2', title: 'زيارة ميدانية', description: 'صيانة وفحص دوري', quantity: 2, unitPrice: 600 },
  ],
};

// سجل الفاتورة #1038 زي التصميم (الأحدث الأول)
const SPECIAL_HISTORY: Record<number, HistoryEvent[]> = {
  1038: [
    { id: 'h1', type: 'reminder', at: '2026-10-12T10:30:00Z' },
    { id: 'h2', type: 'viewed', at: '2026-09-03T16:12:00Z' },
    { id: 'h3', type: 'sent', at: '2026-09-01', values: { email: 'accounts@nile.eg' } },
    { id: 'h4', type: 'created', at: '2026-09-01', values: { name: AUTHOR } },
  ],
};

export function getInvoiceDetail(number: number): InvoiceDetail | undefined {
  const invoice = INVOICES.find((i) => i.number === number);
  if (!invoice) return undefined;

  const lines = SPECIAL_LINES[number] ?? [
    {
      id: 'l1',
      title: 'خدمات',
      description: 'بحسب الاتفاق',
      quantity: 1,
      unitPrice: Math.round(invoice.total / (1 + VAT_RATE / 100)),
    },
  ];

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const vat = Math.round((subtotal * VAT_RATE) / 100);
  const rounding = invoice.total - subtotal - vat;

  const paid = invoice.total - invoice.remaining;
  const payments: Payment[] =
    paid > 0
      ? [{ id: 'p1', amount: paid, date: addDays(invoice.issueDate, 2), method: 'bank' }]
      : [];

  let history = SPECIAL_HISTORY[number];
  if (!history) {
    history = [];
    for (const p of payments) {
      history.push({ id: `h-${p.id}`, type: 'payment', at: p.date, values: { amount: p.amount } });
    }
    if (invoice.status !== 'draft') {
      history.push({
        id: 'h-sent',
        type: 'sent',
        at: invoice.issueDate,
        values: { email: 'accounts@client.example.com' },
      });
    }
    history.push({ id: 'h-created', type: 'created', at: invoice.issueDate, values: { name: AUTHOR } });
  }

  return {
    ...invoice,
    issuer: ISSUER,
    client: clientInfo(invoice.customer),
    lines,
    subtotal,
    vatRate: VAT_RATE,
    vat,
    rounding,
    note: NOTE,
    payments,
    history,
  };
}