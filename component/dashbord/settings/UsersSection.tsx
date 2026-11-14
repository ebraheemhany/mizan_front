// component/dashbord/settings/UsersSection.tsx
'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Check, Loader2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import ConfirmDialog from '@/component/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { INVITE_ROLES, PERMISSIONS, ROLES, can, type InvitableRole } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import {
  useChangeRoleMutation,
  usePendingInvitations,
  useRemoveMemberMutation,
  useRevokeInvitationMutation,
  useTeamMembers,
  type PendingInvitation,
  type TeamMember,
} from '@/lib/team/hooks';
import InviteSheet from './InviteSheet';
import SettingsSelect from './SettingsSelect';

const card = 'rounded-card border-line bg-surface border p-5 shadow-sm sm:p-6';

export default function UsersSection() {
  const t = useTranslations('Settings.users');
  const tTeam = useTranslations('Team');
  const user = useSession();

  return (
    <div id="settings-users" className="grid scroll-mt-24 grid-cols-1 gap-4 lg:grid-cols-2">
      {can(user.role, 'settings') ? (
        <TeamCard currentUserId={user.id} />
      ) : (
        <section className={card}>
          <h2 className="text-ink text-sm font-extrabold">{t('title')}</h2>
          <p className="text-muted mt-2 text-xs">{tTeam('ownerOnly')}</p>
        </section>
      )}
      <PermissionsCard />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team list (owner only)
// ---------------------------------------------------------------------------

type Confirm =
  | { kind: 'remove'; member: TeamMember }
  | { kind: 'revoke'; invitation: PendingInvitation }
  | null;

function TeamCard({ currentUserId }: { currentUserId: string }) {
  const t = useTranslations('Settings.users');
  const tTeam = useTranslations('Team');
  const format = useFormatter();
  const errorMessage = useApiErrorMessage();

  const members = useTeamMembers();
  const invitations = usePendingInvitations();
  const changeRole = useChangeRoleMutation();
  const removeMember = useRemoveMemberMutation();
  const revokeInvitation = useRevokeInvitationMutation();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const total = (members.data?.length ?? 0) + (invitations.data?.length ?? 0);

  function onRoleChange(member: TeamMember, role: InvitableRole) {
    changeRole.mutate(
      { id: member.id, role },
      {
        onSuccess: () => toast.success(tTeam('toasts.roleChanged', { name: member.fullName, role: t(`roles.${role}`) })),
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  }

  function onConfirm() {
    if (!confirm) return;
    if (confirm.kind === 'remove') {
      const { member } = confirm;
      removeMember.mutate(member.id, {
        onSuccess: () => toast.success(tTeam('toasts.removed', { name: member.fullName })),
        onError: (error) => toast.error(errorMessage(error)),
      });
    } else {
      revokeInvitation.mutate(confirm.invitation.id, {
        onSuccess: () => toast.success(tTeam('toasts.revoked')),
        onError: (error) => toast.error(errorMessage(error)),
      });
    }
    setConfirm(null);
  }

  return (
    <section className={card}>
      <h2 className="text-ink text-sm font-extrabold">{t('title')}</h2>
      {members.isSuccess && (
        <p className="text-muted mt-0.5 text-[11px]">
          {t('count', { count: total, text: format.number(total, { numberingSystem: 'latn' }) })}
        </p>
      )}

      {members.isPending && (
        <p className="text-muted mt-4 flex items-center gap-2 text-xs">
          <Loader2 className="size-3.5 animate-spin" />
        </p>
      )}

      {members.isError && (
        <div className="mt-4 flex items-center gap-3">
          <p className="text-danger text-xs font-semibold">{tTeam('loadError')}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => members.refetch()}
            className="rounded-btn border-line-strong h-8 border text-xs font-bold"
          >
            {tTeam('retry')}
          </Button>
        </div>
      )}

      <ul className="mt-3">
        {members.data?.map((member) => {
          const isOwner = member.role === 'owner';
          const isMe = member.id === currentUserId;
          const busy =
            (changeRole.isPending && changeRole.variables?.id === member.id) ||
            (removeMember.isPending && removeMember.variables === member.id);

          return (
            <li key={member.id} className="border-line/70 flex items-center gap-3 border-b py-3.5 last:border-b-0">
              <Avatar name={member.fullName} />
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-xs font-bold">
                  {member.fullName}
                  {isMe && <span className="text-muted ms-1.5 font-semibold">({tTeam('you')})</span>}
                </p>
                <p className="text-muted truncate text-[11px]" dir="ltr">
                  {member.email}
                </p>
              </div>

              {isOwner ? (
                <span className="bg-neutral-soft text-ink-2 shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold">
                  {t('roles.owner')}
                </span>
              ) : (
                <div className="flex shrink-0 items-center gap-1.5">
                  <div className="w-32" aria-label={tTeam('roleLabel', { name: member.fullName })}>
                    <SettingsSelect
                      id={`role-${member.id}`}
                      value={member.role}
                      onValueChange={(role) => onRoleChange(member, role as InvitableRole)}
                      options={INVITE_ROLES.map((role) => ({ value: role, label: t(`roles.${role}`) }))}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirm({ kind: 'remove', member })}
                    aria-label={tTeam('remove', { name: member.fullName })}
                    className="text-muted hover:text-danger hover:bg-danger-soft rounded-btn flex size-8 items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  </button>
                </div>
              )}
            </li>
          );
        })}

        {invitations.data?.map((invitation) => (
          <li key={invitation.id} className="border-line/70 flex items-center gap-3 border-b py-3.5 last:border-b-0">
            <Avatar name={invitation.name} muted />
            <div className="min-w-0 flex-1">
              <p className="text-ink truncate text-xs font-bold">{invitation.name}</p>
              <p className="text-muted truncate text-[11px]">
                <span dir="ltr">{invitation.email}</span>
                {' · '}
                {tTeam('expires', {
                  date: format.dateTime(new Date(invitation.expiresAt), { day: 'numeric', month: 'short' }),
                })}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
              <span className="size-1.5 rounded-full bg-amber-500" />
              {t(`roles.${invitation.role}`)} · {t('pendingBadge')}
            </span>
            <button
              type="button"
              onClick={() => setConfirm({ kind: 'revoke', invitation })}
              aria-label={tTeam('revoke')}
              title={tTeam('revoke')}
              className="text-muted hover:text-danger hover:bg-danger-soft rounded-btn flex size-8 shrink-0 items-center justify-center transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {/* type=button so it doesn't submit the surrounding settings form */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setInviteOpen(true)}
        className="rounded-btn border-line-strong mt-3 h-9 border text-xs font-bold"
      >
        {t('inviteButton')}
      </Button>

      <InviteSheet open={inviteOpen} onOpenChange={setInviteOpen} />

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.kind === 'remove'
            ? tTeam('confirmRemove.title', { name: confirm.member.fullName })
            : tTeam('confirmRevoke.title', { email: confirm?.invitation.email ?? '' })
        }
        description={
          confirm?.kind === 'remove' ? tTeam('confirmRemove.description') : tTeam('confirmRevoke.description')
        }
        confirmLabel={confirm?.kind === 'remove' ? tTeam('confirmRemove.confirm') : tTeam('confirmRevoke.confirm')}
        cancelLabel={tTeam('confirmRemove.cancel')}
        onConfirm={onConfirm}
        onClose={() => setConfirm(null)}
      />
    </section>
  );
}

function Avatar({ name, muted = false }: { name: string; muted?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
        muted ? 'bg-neutral-soft text-muted' : 'bg-brand-soft text-brand-deep'
      }`}
    >
      {Array.from(name)[0]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Permissions table (everyone)
// ---------------------------------------------------------------------------

function PermissionsCard() {
  const t = useTranslations('Settings.users');

  return (
    <section className={card}>
      <h2 className="text-ink text-sm font-extrabold">{t('matrix.title')}</h2>
      <p className="text-muted mt-0.5 text-[11px]">{t('matrix.description')}</p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse">
          <thead className="bg-neutral-soft/70">
            <tr>
              <th className="text-ink-2 px-3 py-2.5 text-start text-[11px] font-bold">{t('matrix.permission')}</th>
              {ROLES.map((r) => (
                <th key={r} className="text-ink-2 px-3 py-2.5 text-center text-[11px] font-bold">
                  {t(`roles.${r}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((p) => (
              <tr key={p.key} className="border-line/70 border-t">
                <td className="text-ink px-3 py-3 text-xs font-semibold">{t(`matrix.perms.${p.key}`)}</td>
                {ROLES.map((r) => (
                  <td key={r} className="px-3 py-3 text-center">
                    {can(r, p.key) ? (
                      <Check className="text-brand mx-auto size-4" aria-label={t('matrix.allowed')} />
                    ) : (
                      <span className="text-muted" aria-label={t('matrix.denied')}>
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
  );
}
