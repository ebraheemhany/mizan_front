// lib/settings/hooks.ts
// Company settings (backend /api/settings) and conversion to/from the settings form.
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiUpload, type SessionUser } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import type { SettingsValues } from '@/lib/validations/settings';

export type ApiSettings = {
  company: {
    name: string;
    taxNumber: string | null;
    commercialRegister: string | null;
    phone: string | null;
    address: string | null;
    /** Comes back only (set through /api/settings/logo); null when there is none. */
    logoId?: string | null;
  };
  taxes: {
    vatEnabled: boolean;
    withholdingEnabled: boolean;
    currency: SettingsValues['taxes']['currency'];
    fiscalStartMonth: number;
  };
  numbering: {
    invoicePrefix: string;
    invoiceNext: number;
    quotePrefix: string;
    quoteNext: number;
    paymentTermsDays: number;
  };
  template: { style: SettingsValues['template']['style']; footer: string | null };
  notifications: SettingsValues['notifications'];
  integrations: SettingsValues['integrations'];
};

/** API -> form values (the form keeps numbers as text and empty fields as ''). */
export function toFormValues(s: ApiSettings): SettingsValues {
  return {
    company: {
      name: s.company.name,
      taxNumber: s.company.taxNumber ?? '',
      commercialRegister: s.company.commercialRegister ?? '',
      phone: s.company.phone ?? '',
      address: s.company.address ?? '',
    },
    taxes: { ...s.taxes, fiscalStartMonth: String(s.taxes.fiscalStartMonth) },
    numbering: {
      invoicePrefix: s.numbering.invoicePrefix,
      invoiceNext: String(s.numbering.invoiceNext),
      quotePrefix: s.numbering.quotePrefix,
      quoteNext: String(s.numbering.quoteNext),
      paymentTermsDays: String(s.numbering.paymentTermsDays) as SettingsValues['numbering']['paymentTermsDays'],
    },
    template: { style: s.template.style, footer: s.template.footer ?? '' },
    notifications: s.notifications,
    integrations: s.integrations,
  };
}

/** Form values -> API body (all sections; empty text clears a field). */
export function toApiBody(v: SettingsValues): ApiSettings {
  return {
    company: v.company,
    taxes: { ...v.taxes, fiscalStartMonth: Number(v.taxes.fiscalStartMonth) },
    numbering: {
      invoicePrefix: v.numbering.invoicePrefix,
      invoiceNext: Number(v.numbering.invoiceNext),
      quotePrefix: v.numbering.quotePrefix,
      quoteNext: Number(v.numbering.quoteNext),
      paymentTermsDays: Number(v.numbering.paymentTermsDays),
    },
    template: v.template,
    notifications: v.notifications,
    integrations: v.integrations,
  };
}

// ---------------------------------------------------------------------------
// The company logo (saved right away, apart from the form)
// ---------------------------------------------------------------------------

/** What a logo may be (the server checks the file itself too). SVG is refused: it can carry scripts. */
export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const LOGO_MAX_BYTES = 1024 * 1024;

export const logoProblem = (file: File) => !LOGO_TYPES.includes(file.type) || file.size > LOGO_MAX_BYTES;

/** The new logo id goes into the cached settings; invoices and quotes show it on their next load. */
function useLogoMutation<T>(mutationFn: (input: T) => Promise<string | null>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (logoId) => {
      queryClient.setQueryData<ApiSettings>(queryKeys.settings, (s) =>
        s ? { ...s, company: { ...s.company, logoId } } : s,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all });
    },
  });
}

export function useSetLogo() {
  return useLogoMutation(async (file: File) =>
    (await apiUpload<{ logoId: string }>('/api/settings/logo', file, file.name)).logoId,
  );
}

export function useRemoveLogo() {
  return useLogoMutation(async () => {
    await api('/api/settings/logo', { method: 'DELETE' });
    return null;
  });
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: async () => (await api<{ settings: ApiSettings }>('/api/settings')).settings,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ApiSettings) =>
      (await api<{ settings: ApiSettings }>('/api/settings', { method: 'PATCH', body })).settings,
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.settings, settings);
      // The company name shows in the user menu and the currency on every amount: keep
      // the session in step so the whole app follows at once.
      queryClient.setQueryData<SessionUser | null>(queryKeys.session, (user) =>
        user
          ? { ...user, company: { ...user.company, name: settings.company.name, currency: settings.taxes.currency } }
          : user,
      );
    },
  });
}
