// lib/collections/hooks.ts
// Collecting invoice payments from customers: the company's payment setup (transfer
// details, its own Paymob account), customers' receipts to review, proofs on
// payments, and the customer side on the public invoice link.
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiBlob, apiPublicUpload, apiUpload } from '@/lib/api/client';
import { useRecordInvoicePayment, useRefreshInvoice, type ApiClaim, type PublicPayOptions } from '@/lib/invoices/hooks';
import { queryKeys } from '@/lib/query/keys';

export type TransferDetails = NonNullable<PublicPayOptions['transfer']>;

export type PaymentSetup = {
  transfer: TransferDetails;
  paymob: {
    connected: boolean;
    /** Live keys; false = test keys (no real money). */
    live: boolean;
    publicKey: string | null;
    integrationId: number | null;
    connectedAt: string | null;
  };
};

export type PaymobAccountInput = { secretKey: string; publicKey: string; hmacSecret: string; integrationId: string };

/** A claim on the review list: the receipt plus which invoice it is for. */
export type ReviewClaim = ApiClaim & {
  reviewedAt: string | null;
  invoice: { id: string; number: number; displayNumber: string; customer: string };
};

// ---------------------------------------------------------------------------
// The company's setup (Settings)
// ---------------------------------------------------------------------------

export function usePaymentSetup() {
  return useQuery({
    queryKey: queryKeys.collections.setup,
    queryFn: async () => (await api<{ setup: PaymentSetup }>('/api/payment-setup')).setup,
  });
}

function useSetupMutation<T>(call: (input: T) => Promise<{ setup: PaymentSetup }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: T) => (await call(input)).setup,
    onSuccess: (setup) => queryClient.setQueryData(queryKeys.collections.setup, setup),
  });
}

export const useSaveTransferDetails = () =>
  useSetupMutation((input: TransferDetails) => api('/api/payment-setup/transfer', { method: 'PUT', body: input }));

export const useConnectPaymob = () =>
  useSetupMutation((input: PaymobAccountInput) => api('/api/payment-setup/paymob', { method: 'PUT', body: input }));

export const useDisconnectPaymob = () =>
  useSetupMutation<void>(() => api('/api/payment-setup/paymob', { method: 'DELETE' }));

// ---------------------------------------------------------------------------
// Reviewing customers' receipts
// ---------------------------------------------------------------------------

/** Receipts waiting for review across all invoices (notifications, dashboard). */
export function usePendingClaims(enabled = true) {
  return useQuery({
    queryKey: queryKeys.collections.claims('pending'),
    queryFn: async () => (await api<{ items: ReviewClaim[] }>('/api/payment-claims?status=pending')).items,
    enabled,
    staleTime: 60_000,
  });
}

function useAfterReview() {
  const queryClient = useQueryClient();
  return () => {
    // Accepting records a payment: the invoice, its customer, the books and reports change.
    for (const key of [
      queryKeys.collections.all,
      queryKeys.invoices.all,
      queryKeys.customers.all,
      queryKeys.payments.all,
      queryKeys.dashboard,
      queryKeys.reports.all,
      queryKeys.ledger.all,
    ]) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  };
}

export function useAcceptClaim() {
  const after = useAfterReview();
  return useMutation({
    mutationFn: ({ id, account }: { id: string; account?: 'bank' | 'cashbox' | 'wallet' }) =>
      api<{ claim: ReviewClaim }>(`/api/payment-claims/${id}/accept`, { method: 'POST', body: account ? { account } : {} }),
    onSettled: after,
  });
}

export function useRejectClaim() {
  const after = useAfterReview();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api<{ claim: ReviewClaim }>(`/api/payment-claims/${id}/reject`, { method: 'POST', body: { reason } }),
    onSettled: after,
  });
}

/**
 * Opens a protected file in a new tab: the tab opens inside the click (so popup
 * blockers allow it) and is shown the file once it arrives.
 */
async function openProtected(path: string) {
  const tab = window.open('', '_blank');
  try {
    const url = URL.createObjectURL(await apiBlob(path));
    if (tab) tab.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    tab?.close();
    throw error;
  }
}

export const openClaimReceipt = (id: string) => openProtected(`/api/payment-claims/${id}/receipt`);
export const openPaymentProof = (paymentId: string) => openProtected(`/api/payments/${paymentId}/proof`);

/** Attaches the proof of a payment staff recorded (a receipt or transfer screenshot). */
export const uploadPaymentProof = (paymentId: string, file: File) =>
  apiUpload(`/api/payments/${paymentId}/proof`, file, file.name);

export type StaffPayment = {
  amount: number;
  date: string;
  method: string;
  reference: string;
  note: string;
  proof: File | null;
};

/**
 * Records a payment on an invoice, then uploads its proof if one was picked.
 * The payment counts either way: proofFailed says only the file didn't make it.
 */
export function useRecordPaymentWithProof() {
  const record = useRecordInvoicePayment();
  const refresh = useRefreshInvoice();
  return useMutation({
    mutationFn: async ({ ref, input }: { ref: string | number; input: StaffPayment }) => {
      const { paymentId } = await record.mutateAsync({
        ref,
        body: {
          amount: input.amount.toFixed(2),
          date: input.date,
          method: input.method,
          ...(input.reference ? { reference: input.reference } : {}),
          note: input.note,
        },
      });
      if (!input.proof) return { proofFailed: false };
      try {
        await uploadPaymentProof(paymentId, input.proof);
        refresh();
        return { proofFailed: false };
      } catch {
        return { proofFailed: true };
      }
    },
  });
}

// ---------------------------------------------------------------------------
// The customer, on the public invoice link
// ---------------------------------------------------------------------------

export type ClaimInput = {
  amount: string;
  date: string;
  method: 'bank' | 'instapay' | 'vodafoneCash';
  reference: string;
  payerName: string;
  note: string;
};

export function useSubmitClaim(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, file }: { input: ClaimInput; file: File }) => {
      const query = new URLSearchParams(Object.entries(input).filter(([, v]) => v.trim() !== ''));
      return apiPublicUpload(`/api/public/invoices/${token}/claims?${query}`, file, file.name);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.publicInvoice(token) }),
  });
}

/** Starts a card payment; the page then goes to Paymob's checkout. */
export function useStartCheckout(token: string) {
  return useMutation({
    mutationFn: (locale: 'ar' | 'en') =>
      api<{ url: string }>(`/api/public/invoices/${token}/checkout`, { method: 'POST', auth: false, body: { locale } }),
  });
}

/** How a card payment ended, asked every few seconds while Paymob's answer is on its way. */
export function useOnlinePaymentStatus(token: string, id: string | null) {
  return useQuery({
    queryKey: queryKeys.onlinePayment(token, id ?? ''),
    queryFn: () =>
      api<{ status: 'pending' | 'paid' | 'failed'; amount: string }>(`/api/public/invoices/${token}/checkout/${id}`, {
        auth: false,
      }),
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 3000 : false),
    retry: false,
  });
}
