// component/dashbord/settings/SettingsView.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FormProvider, useForm, useFormState } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/component/PageHeader';
import { Button } from '@/components/ui/button';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { toApiBody, toFormValues, useSettings, useUpdateSettings } from '@/lib/settings/hooks';
import {
  settingsSchema,
  type SettingsValues,
} from '@/lib/validations/settings';
import ReportsTabs from '../reports/ReportsTabs';
import CompanyCard from './CompanyCard';
import NumberingCard from './NumberingCard';
import TaxesCard from './TaxesCard';
import TemplateCard from './TemplateCard';
import UsersSection from './UsersSection';
import NotificationsSection from './NotificationsSection';
import { SecuritySection } from './SecuritySection';
import { SubscriptionSection } from './SubscriptionSection';
type TabKey =
  | 'company'
  | 'taxes'
  | 'numbering'
  | 'template'
  | 'users'
  | 'notifications'
  | 'integrations'
  | 'security'
  | 'subscription';

const TAB_KEYS: TabKey[] = [
  'company',
  'taxes',
  'numbering',
  'template',
  'users',
  'notifications',
  'integrations',
  'security',
  'subscription',
];

const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

/** Loads the company settings, then shows the form with them. */
export default function SettingsView() {
  const tApi = useTranslations('SettingsApi');
  const settings = useSettings();

  if (settings.isPending) {
    return (
      <div className="text-muted flex justify-center py-20">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (settings.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-danger text-sm font-semibold">{tApi('loadError')}</p>
        <Button variant="outline" className="rounded-btn h-10 text-xs font-bold" onClick={() => settings.refetch()}>
          {tApi('retry')}
        </Button>
      </div>
    );
  }
  return <SettingsForm initial={toFormValues(settings.data)} />;
}

function SettingsForm({ initial }: { initial: SettingsValues }) {
  const t = useTranslations('Settings');
  const errorMessage = useApiErrorMessage();
  const user = useSession();
  // Only the owner changes company settings; everyone else sees them read-only.
  const canEdit = can(user.role, 'settings');
  const updateSettings = useUpdateSettings();
  const [tab, setTab] = useState<TabKey>('company');

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
  });
  // Subscribed here, at render: react-hook-form only keeps the form state it is asked
  // for while rendering (read inside save() alone, isDirty stayed false and nothing saved).
  const { isDirty, isSubmitting } = useFormState({ control: form.control });

  const tabs = TAB_KEYS.map((key) => ({
    value: key,
    label: t(`tabs.${key}`),
  }));

  useEffect(() => {
    const sections = TAB_KEYS.map((key) =>
      document.getElementById(`settings-${key}`),
    ).filter((section): section is HTMLElement => section !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (active) {
          const activeKey = TAB_KEYS.find(
            (key) => active.target.id === `settings-${key}`,
          );
          if (activeKey) setTab(activeKey);
        }
      },
      { rootMargin: '-112px 0px -70% 0px' },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function goTo(key: TabKey) {
    const el = document.getElementById(`settings-${key}`);
    if (el) {
      setTab(key);
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // الأقسام اللي لسه ما اتبنتش
      toast.info(t('toasts.soon'));
    }
  }

  async function save(values: SettingsValues) {
    if (!isDirty) {
      toast.info(t('toasts.noChanges'));
      return;
    }
    try {
      const saved = await updateSettings.mutateAsync(toApiBody(values));
      // Start "not dirty" again from what the server actually stored.
      form.reset(toFormValues(saved));
      toast.success(t('toasts.saved'));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(save)} noValidate className="space-y-5">
        <PageHeader
          title={t('title')}
          description={t('description')}
          actions={
            canEdit && (
              <Button type="submit" disabled={isSubmitting} className={primaryBtn}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {t('actions.save')}
              </Button>
            )
          }
        />

        <ReportsTabs value={tab} tabs={tabs} onChange={goTo} />

        {/* A disabled fieldset makes every field inside read-only for non-owners. */}
        <fieldset disabled={!canEdit} className="space-y-5">
          <CompanyCard />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TaxesCard />
            <NumberingCard />
          </div>
          <TemplateCard />
        </fieldset>
        <UsersSection />
        <fieldset disabled={!canEdit}>
          <NotificationsSection />
        </fieldset>
        <div className="grid gap-6 lg:grid-cols-2">
          <SecuritySection />
          <SubscriptionSection />
        </div>
      </form>
    </FormProvider>
  );
}
