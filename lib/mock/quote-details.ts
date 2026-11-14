// lib/mock/quote-details.ts
import { addDaysIso } from '@/lib/iso-date';
import { clientInfo, ISSUER, type InvoiceLine, type Party } from './invoice-details';
import { effectiveStatus, QUOTES, TODAY, type Quote } from './quotes';

const VAT_RATE = 14;

export type QuoteEvent = {
  id: string;
  type: 'created' | 'sent' | 'accepted' | 'rejected' | 'expired';
  at: string; // yyyy-mm-dd
};

export type QuoteDetail = Quote & {
  issuer: Party;
  client: Party;
  lines: InvoiceLine[];
  subtotal: number;
  vatRate: number;
  vat: number;
  rounding: number;
  note: string;
  history: QuoteEvent[]; // الأحدث أولاً
};

// TODO: لما نربط الـ API الصفحة دي بتجيب العرض وبنوده وسجله من الباك إند
export function getQuoteDetail(number: number): QuoteDetail | undefined {
  const q = QUOTES.find((x) => x.number === number);
  if (!q) return undefined;

  return createQuoteDetail(q);
}

export function createQuoteDetail(q: Quote): QuoteDetail {
  const lines: InvoiceLine[] = q.items?.length
    ? q.items.map((item, index) => ({
        id: `l${index + 1}`,
        title: item.description,
        description: '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    : [
        {
          id: 'l1',
          title: 'خدمات',
          description: 'بحسب الاتفاق',
          quantity: 1,
          unitPrice: Math.round(q.total / (1 + VAT_RATE / 100)),
        },
      ];

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const vat = Math.round(subtotal * VAT_RATE) / 100;

  // الأحداث بتتجمع بالترتيب الزمني ثم بتتعكس علشان الأحدث يبقى فوق
  const events: QuoteEvent[] = [{ id: 'e-created', type: 'created', at: q.issueDate }];
  if (q.status !== 'draft') {
    events.push({
      id: 'e-sent',
      type: 'sent',
      at: q.sentDate ?? q.issueDate,
    });
  }
  if (q.status === 'accepted') {
    events.push({ id: 'e-accepted', type: 'accepted', at: q.acceptedDate ?? addDaysIso(q.issueDate, 5) });
  }
  if (q.status === 'rejected') {
    const at = q.rejectedDate ?? addDaysIso(q.issueDate, 6);
    events.push({ id: 'e-rejected', type: 'rejected', at: at > TODAY ? TODAY : at });
  }
  if (effectiveStatus(q) === 'expired') {
    events.push({ id: 'e-expired', type: 'expired', at: q.validUntil });
  }

  return {
    ...q,
    issuer: ISSUER,
    client: clientInfo(q.customer),
    lines,
    subtotal,
    vatRate: VAT_RATE,
    vat,
    rounding: Math.round((q.total - subtotal - vat) * 100) / 100,
    note: q.notes || '',
    history: events.reverse(),
  };
}