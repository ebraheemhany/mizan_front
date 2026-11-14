// component/dashbord/settings/NotificationsSection.tsx
'use client';

import { useTranslations } from 'next-intl';

import SwitchField from './SwitchField';

const card = 'rounded-card border-line bg-surface border p-5 shadow-sm sm:p-6';

const NOTIFICATIONS = [
  'overdueInvoice',
  'newPayment',
  'taskReminder',
  'weeklyDigest',
] as const;

const INTEGRATIONS = ['whatsapp', 'paymentGateway', 'eta', 'calendar'] as const;

export default function NotificationsSection() {
  const t = useTranslations('Settings');

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section
        id="settings-notifications"
        className={`${card} scroll-mt-24`}
      >
        <h2 className="text-ink text-sm font-extrabold">
          {t('notifications.title')}
        </h2>
        <div className="mt-5 space-y-5">
          {NOTIFICATIONS.map((key) => (
            <SwitchField
              key={key}
              name={`notifications.${key}`}
              label={t(`notifications.items.${key}.label`)}
              hint={t(`notifications.items.${key}.hint`)}
            />
          ))}
        </div>
      </section>

      {/* id للتاب: التكاملات */}
      <section id="settings-integrations" className={`${card} scroll-mt-24`}>
        <h2 className="text-ink text-sm font-extrabold">
          {t('integrations.title')}
        </h2>
        <div className="mt-5 space-y-5">
          {INTEGRATIONS.map((key) => (
            <SwitchField
              key={key}
              name={`integrations.${key}`}
              label={t(`integrations.items.${key}.label`)}
              hint={t(`integrations.items.${key}.hint`)}
              disabled={key === 'eta'}
              badge={
                key === 'eta' ? (
                  <span className="bg-neutral-soft text-ink-2 rounded-full px-2 py-0.5 text-[10px] font-bold">
                    {t('integrations.soon')}
                  </span>
                ) : undefined
              }
            />
          ))}
        </div>
        {/* TODO: التفعيل الفعلي للتكاملات لما نربط الـ API */}
      </section>
    </div>
  );
}
