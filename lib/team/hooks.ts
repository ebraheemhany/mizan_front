// lib/team/hooks.ts
// Team management (owner only) and invite links, on top of the backend's
// /api/users and /api/invitations endpoints.
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api, type Role } from '@/lib/api/client';
import type { InvitableRole } from '@/lib/auth/permissions';
import { queryKeys } from '@/lib/query/keys';

export type TeamMember = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
};

export type PendingInvitation = {
  id: string;
  email: string;
  name: string;
  role: InvitableRole;
  expiresAt: string;
  createdAt: string;
  invitedBy: { id: string; fullName: string } | null;
};

export type InvitationPreview = {
  email: string;
  name: string;
  role: InvitableRole;
  expiresAt: string;
  company: { name: string };
};

// ---------------------------------------------------------------------------
// Owner: team and pending invites
// ---------------------------------------------------------------------------

export function useTeamMembers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.team.members,
    queryFn: async () => (await api<{ users: TeamMember[] }>('/api/users')).users,
    enabled,
  });
}

export function usePendingInvitations(enabled = true) {
  return useQuery({
    queryKey: queryKeys.team.invitations,
    queryFn: async () => (await api<{ invitations: PendingInvitation[] }>('/api/invitations')).invitations,
    enabled,
  });
}

export function useInviteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; email: string; role: InvitableRole; locale: 'ar' | 'en' }) =>
      // emailSent: false when the invitation email couldn't go (the link can still be copied).
      api<{ invitation: PendingInvitation; inviteUrl: string; emailSent: boolean }>('/api/invitations', {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.team.invitations });
      // Pending invitations take a seat of the plan.
      void queryClient.invalidateQueries({ queryKey: queryKeys.billing.all });
    },
  });
}

export function useRevokeInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/invitations/${id}`, { method: 'DELETE' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.team.invitations }),
  });
}

export function useChangeRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: InvitableRole }) =>
      api<{ user: TeamMember }>(`/api/users/${id}`, { method: 'PATCH', body: { role } }),
    // Show the new role right away, without refetching the list.
    onSuccess: ({ user }) =>
      queryClient.setQueryData<TeamMember[]>(queryKeys.team.members, (list) =>
        list?.map((member) => (member.id === user.id ? user : member)),
      ),
  });
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/users/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, id) =>
      queryClient.setQueryData<TeamMember[]>(queryKeys.team.members, (list) =>
        list?.filter((member) => member.id !== id),
      ),
  });
}

// ---------------------------------------------------------------------------
// Public: the invited person (no account yet)
// ---------------------------------------------------------------------------

export function useInvitationPreview(token: string) {
  return useQuery({
    queryKey: queryKeys.invitationPreview(token),
    queryFn: async () =>
      (
        await api<{ invitation: InvitationPreview }>('/api/invitations/preview', {
          method: 'POST',
          auth: false,
          body: { token },
        })
      ).invitation,
    // An invalid or used link stays invalid: no point retrying it.
    retry: (count, error) => count < 2 && !(error instanceof ApiError && error.status < 500 && error.status > 0),
    staleTime: Infinity,
  });
}

export function useAcceptInvitationMutation() {
  return useMutation({
    mutationFn: (input: { token: string; password: string; fullName?: string; locale: 'ar' | 'en' }) =>
      api('/api/invitations/accept', { method: 'POST', auth: false, body: input }),
  });
}
