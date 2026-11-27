// component/dashbord/team/OwnerPicker.tsx
// Picking the responsible team member (a deal's owner, a customer's account manager), with
// a way to bring someone new onto the team from right there.
'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown, Clock, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSession } from '@/lib/auth/session';
import { useBilling } from '@/lib/billing/hooks';
import { usePendingInvitations } from '@/lib/team/hooks';
import { cn } from '@/lib/utils';
import InviteSheet from '../settings/InviteSheet';
import { UpgradePlanDialog } from '../settings/UpgradePlanDialog';

export type OwnerOption = { id: string; name: string };

export type OwnerInvite = {
  /** Invitations not accepted yet: shown dimmed, not pickable. */
  pending: OwnerOption[];
  /** The company owner only (the one who invites); others are told to ask them. */
  onInvite?: () => void;
};

/**
 * Inviting from a picker: the invitation sheet, or the upgrade first when the plan's seats
 * are taken. Render `dialogs` outside the surrounding <form>: React events cross portals,
 * so a submit inside the invitation would otherwise submit that form too.
 */
export function useOwnerInvite(): OwnerInvite & { dialogs: ReactNode } {
  const user = useSession();
  const isOwner = user.role === 'owner';
  const invitations = usePendingInvitations(isOwner);
  const billing = useBilling();
  const [inviting, setInviting] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const seatsFull = billing.data ? billing.data.usage.users >= billing.data.usage.usersLimit : false;

  return {
    pending: (invitations.data ?? []).map((i) => ({ id: i.id, name: i.name || i.email })),
    onInvite: isOwner ? () => (seatsFull ? setUpgrading(true) : setInviting(true)) : undefined,
    dialogs: isOwner ? (
      <>
        <InviteSheet open={inviting} onOpenChange={setInviting} />
        <UpgradePlanDialog open={upgrading} onClose={() => setUpgrading(false)} />
      </>
    ) : null,
  };
}

/** The responsible team member, searchable; `allowNone` adds "nobody yet". */
export default function OwnerPicker({
  id,
  value,
  owners,
  allowNone = false,
  invite,
  onChange,
}: {
  id: string;
  value: string;
  owners: OwnerOption[];
  allowNone?: boolean;
  invite: OwnerInvite;
  onChange: (id: string) => void;
}) {
  const t = useTranslations('OwnerPicker');
  const [open, setOpen] = useState(false);
  const current = owners.find((owner) => owner.id === value);
  const options = allowNone ? [{ id: '', name: t('none') }, ...owners] : owners;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        className="rounded-btn bg-surface border-line-strong hover:border-brand/50 hover:bg-canvas focus-visible:border-brand focus-visible:ring-brand/15 flex h-11 w-full items-center gap-3 border px-3 text-start text-sm font-semibold transition-colors outline-none focus-visible:ring-2"
      >
        <span className={cn('min-w-0 flex-1 truncate', current ? 'text-ink' : 'text-muted')}>
          {current ? current.name : allowNone ? t('none') : t('choose')}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="border-line bg-surface w-[min(24rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-xl border p-0 shadow-lg"
      >
        <Command className="bg-surface rounded-xl p-1.5">
          <CommandInput placeholder={t('search')} className="text-ink placeholder:text-muted" />
          <CommandList className="max-h-64 py-1">
            <CommandEmpty className="text-muted py-5">{t('empty')}</CommandEmpty>
            <CommandGroup>
              {options.map((owner) => (
                <CommandItem
                  key={owner.id || 'none'}
                  value={owner.name}
                  onSelect={() => {
                    onChange(owner.id);
                    setOpen(false);
                  }}
                  className={cn('cursor-pointer', owner.id ? 'text-ink' : 'text-muted')}
                >
                  <span className="min-w-0 flex-1 truncate">{owner.name}</span>
                  {owner.id === value && <Check className="text-brand size-4" />}
                </CommandItem>
              ))}
              {invite.pending.map((invitee) => (
                <CommandItem key={invitee.id} value={invitee.name} disabled className="text-muted">
                  <span className="min-w-0 flex-1 truncate">{invitee.name}</span>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold">
                    <Clock className="size-3.5" />
                    {t('pending')}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="border-line border-t px-1 pt-1.5 pb-0.5">
            {invite.onInvite ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  invite.onInvite?.();
                }}
                className="text-brand hover:bg-brand-soft hover:text-brand-deep h-auto w-full justify-start gap-2 rounded-lg px-2 py-2 text-sm font-bold"
              >
                <UserPlus className="size-4" />
                {t('invite')}
              </Button>
            ) : (
              <p className="text-muted px-2 py-1.5 text-xs leading-5">{t('askOwner')}</p>
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
