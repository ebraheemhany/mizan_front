// component/dashbord/settings/SettingsView.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import PageHeader from '@/component/PageHeader';
import { Button } from '@/components/ui/button';
import { mockSettings } from '@/lib/mock/settings';
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

export default function SettingsView() {
  const t = useTranslations('Settings');
  const [tab, setTab] = useState<TabKey>('company');

  // TODO: لما نربط الـ API الإعدادات دي بتيجي من الباك إند
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: mockSettings,
  });

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

  function save(values: SettingsValues) {
    // TODO: PUT /settings لما نربط الـ API
    if (!form.formState.isDirty) {
      toast.info(t('toasts.noChanges'));
      return;
    }
    form.reset(values);
    toast.success(t('toasts.saved'));
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(save)} noValidate className="space-y-5">
        <PageHeader
          title={t('title')}
          description={t('description')}
          actions={
            <Button type="submit" className={primaryBtn}>
              {t('actions.save')}
            </Button>
          }
        />

        <ReportsTabs value={tab} tabs={tabs} onChange={goTo} />

        <CompanyCard />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TaxesCard />
          <NumberingCard />
        </div>
        <TemplateCard />
        <UsersSection />
        <NotificationsSection />
        <div className="grid gap-6 lg:grid-cols-2">
          <SecuritySection />
          <SubscriptionSection />
        </div>
      </form>
    </FormProvider>
  );
}
