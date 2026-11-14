// component/dashbord/settings/UsersSection.tsx
'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  mockMembers,
  PERMISSIONS,
  ROLES,
  type Member,
} from '@/lib/mock/settings';
import type { InviteValues } from '@/lib/validations/invite';
import InviteSheet from './InviteSheet';

const card = 'rounded-card border-line bg-surface border p-5 shadow-sm sm:p-6';

export default function UsersSection() {
  const t = useTranslations('Settings.users');
  const format = useFormatter();

  // TODO: لما نربط الـ API الأعضاء والدعوات تيجي من الباك إند
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [inviteOpen, setInviteOpen] = useState(false);

  function invite(values: InviteValues) {
    // TODO: POST /invitations لما نربط الـ API
    const member: Member = {
      id: `m${Date.now()}`,
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.role,
      status: 'pending',
    };
    setMembers((list) => [...list, member]);
    setInviteOpen(false);

    toast.success(t('toasts.invited', { email: member.email }), {
      action: {
        label: t('toasts.undo'),
        onClick: () =>
          setMembers((list) => list.filter((m) => m.id !== member.id)),
      },
    });
  }

  return (
    <div
      id="settings-users"
      className="grid scroll-mt-24 grid-cols-1 gap-4 lg:grid-cols-2"
    >
      <section className={card}>
        <h2 className="text-ink text-sm font-extrabold">{t('title')}</h2>
        <p className="text-muted mt-0.5 text-[11px]">
          {t('count', {
            count: members.length,
            text: format.number(members.length, { numberingSystem: 'latn' }),
          })}
        </p>

        <ul className="mt-3">
          {members.map((m) => (
            <li
              key={m.id}
              className="border-line/70 flex items-center gap-3 border-b py-3.5 last:border-b-0"
            >
              <span
                aria-hidden
                className="bg-brand-soft text-brand-deep flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold"
              >
                {Array.from(m.name)[0]}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-xs font-bold">{m.name}</p>
                <p className="text-muted truncate text-[11px]" dir="auto">
                  {m.status === 'pending' ? t('pendingInvite') : m.email}
                </p>
              </div>

              {m.status === 'pending' ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  {t('pendingBadge')}
                </span>
              ) : (
                <span className="bg-neutral-soft text-ink-2 shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold">
                  {t(`roles.${m.role}`)}
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* type=button علشان ما يعملش submit لفورم الإعدادات */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setInviteOpen(true)}
          className="rounded-btn border-line-strong mt-3 h-9 border text-xs font-bold"
        >
          {t('inviteButton')}
        </Button>
      </section>

      <section className={card}>
        <h2 className="text-ink text-sm font-extrabold">{t('matrix.title')}</h2>
        <p className="text-muted mt-0.5 text-[11px]">
          {t('matrix.description')}
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse">
            <thead className="bg-neutral-soft/70">
              <tr>
                <th className="text-ink-2 px-3 py-2.5 text-start text-[11px] font-bold">
                  {t('matrix.permission')}
                </th>
                {ROLES.map((r) => (
                  <th
                    key={r}
                    className="text-ink-2 px-3 py-2.5 text-center text-[11px] font-bold"
                  >
                    {t(`roles.${r}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p.key} className="border-line/70 border-t">
                  <td className="text-ink px-3 py-3 text-xs font-semibold">
                    {t(`matrix.perms.${p.key}`)}
                  </td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-3 py-3 text-center">
                      {p.roles.includes(r) ? (
                        <Check
                          className="text-brand mx-auto size-4"
                          aria-label={t('matrix.allowed')}
                        />
                      ) : (
                        <span
                          className="text-muted"
                          aria-label={t('matrix.denied')}
                        >
                          —
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <InviteSheet
        open={inviteOpen}
        members={members}
        onOpenChange={setInviteOpen}
        onInvite={invite}
      />
    </div>
  );
}
