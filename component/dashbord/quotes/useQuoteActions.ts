// components/quotes/useQuoteActions.ts
// The actions on one quote (send, accept, reject, duplicate, delete, copy its link,
// convert), shared by the quotes list and the quote page: the API call, the toast,
// and which of them the current user may use on a given quote.
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { useDeleteQuote, useFetchQuote, useQuoteAction, type Quote } from '@/lib/quotes/hooks';

type QuoteRef = Pick<Quote, 'id' | 'number' | 'displayNumber' | 'customer' | 'status' | 'invoice'>;

/** API errors in the user's language; a future date gets the quote wording, not the invoice one. */
export function useQuoteErrorMessage() {
  const tApi = useTranslations('QuotesApi');
  const errorMessage = useApiErrorMessage();
  return (error: unknown) =>
    error instanceof ApiError && error.code === 'FUTURE_ISSUE_DATE' ? tApi('futureIssueDate') : errorMessage(error);
}

/** The public link a customer opens to see and answer a quote (a random token, not its number). */
export function quoteShareUrl(locale: string, token: string) {
  return `${window.location.origin}/${locale}/share/quotes/${token}`;
}

export function useQuoteActions() {
  const t = useTranslations('Quotes');
  const tApi = useTranslations('QuotesApi');
  const locale = useLocale();
  const router = useRouter();
  const user = useSession();
  const errorMessage = useQuoteErrorMessage();
  const action = useQuoteAction();
  const deletion = useDeleteQuote();
  const fetchQuote = useFetchQuote();

  const mayManage = can(user.role, 'quotes');
  const mayConvert = can(user.role, 'issueInvoices');
  const mayDeleteSent = can(user.role, 'deleteData');

  // The same rules the backend enforces, used to show or hide actions.
  const allowed = {
    edit: (q: QuoteRef) => mayManage && q.status === 'draft',
    send: (q: QuoteRef) => mayManage && q.status === 'draft',
    /** By email while the customer can still answer it. */
    email: (q: QuoteRef) => mayManage && q.status === 'sent',
    decide: (q: QuoteRef) => mayManage && (q.status === 'sent' || q.status === 'expired'),
    convert: (q: QuoteRef) => mayConvert && q.status === 'accepted' && !q.invoice,
    duplicate: () => mayManage,
    /** Drafts: anyone who handles quotes. Sent ones: only the owner. Converted ones: never. */
    delete: (q: QuoteRef) => !q.invoice && (q.status === 'draft' ? mayManage : mayDeleteSent),
    /** Every quote has its link from the moment it is sent. */
    share: (q: QuoteRef) => q.status !== 'draft',
  };

  async function writeLink(token: string) {
    const url = quoteShareUrl(locale, token);
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('toasts.linkCopied'));
    } catch {
      // Show the link, so it can still be copied by hand.
      toast.error(t('toasts.linkFailed'), { description: url });
    }
  }

  /** Copies the customer link. The list has no token, so the quote is loaded first. */
  async function copyLink(q: QuoteRef & { publicToken?: string | null }) {
    try {
      const token = q.publicToken !== undefined ? q.publicToken : (await fetchQuote(q.number)).publicToken;
      if (!token) {
        toast.info(tApi('linkUnavailable'));
        return;
      }
      await writeLink(token);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const convert = (q: Pick<Quote, 'number'>) => router.push(`/invoices/new?fromQuote=${q.number}`);

  /** Draft -> sent. No undo: the customer may already have the link. */
  async function send(q: QuoteRef) {
    try {
      const sent = await action.mutateAsync({ kind: 'send', ref: q.id });
      const token = sent.publicToken;
      toast.success(t('toasts.sent', { number: sent.displayNumber, customer: sent.customer }), {
        duration: 8000,
        action: token ? { label: t('actions.copyCustomerLink'), onClick: () => void writeLink(token) } : undefined,
      });
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  async function decide(q: QuoteRef, kind: 'accept' | 'reject') {
    try {
      const done = await action.mutateAsync({ kind, ref: q.id });
      if (kind === 'reject') {
        toast.success(t('toasts.rejected', { number: done.displayNumber }));
      } else if (mayConvert && !done.invoice) {
        toast.success(t('toasts.accepted', { number: done.displayNumber }), {
          duration: 8000,
          action: { label: t('toasts.convert'), onClick: () => convert(done) },
        });
      } else {
        toast.success(t('toasts.accepted', { number: done.displayNumber }));
      }
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  /**
   * A new draft dated today. From the list it can be undone (the copy is a draft, so
   * it may be deleted); with `open`, its page opens instead.
   */
  async function duplicate(q: QuoteRef, { open = false }: { open?: boolean } = {}) {
    try {
      const copy = await action.mutateAsync({ kind: 'duplicate', ref: q.id });
      if (open) {
        toast.success(t('toasts.duplicated', { number: copy.displayNumber }));
        router.push(`/quotes/${copy.number}`);
      } else {
        toast.success(t('toasts.duplicated', { number: copy.displayNumber }), {
          action: {
            label: t('toasts.undo'),
            onClick: () => void deletion.mutateAsync(copy.id).catch((error) => toast.error(errorMessage(error))),
          },
        });
      }
      return copy;
    } catch (error) {
      toast.error(errorMessage(error));
      return null;
    }
  }

  /** Permanent (no undo). */
  async function remove(q: QuoteRef) {
    try {
      await deletion.mutateAsync(q.id);
      toast.success(t('toasts.deleted', { number: q.displayNumber }));
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  return {
    /** May create quotes (the "New quote" button). */
    canManage: mayManage,
    allowed,
    pending: action.isPending || deletion.isPending,
    send,
    accept: (q: QuoteRef) => decide(q, 'accept'),
    reject: (q: QuoteRef) => decide(q, 'reject'),
    duplicate,
    remove,
    copyLink,
    convert,
    edit: (q: Pick<Quote, 'number'>) => router.push(`/quotes/new?edit=${q.number}`),
  };
}

export type QuoteActions = ReturnType<typeof useQuoteActions>;
