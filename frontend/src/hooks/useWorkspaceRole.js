import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

export function useWorkspaceRole(members = []) {
  const { user } = useAuth();

  const currentMembership = useMemo(
    () => members.find((m) => m.email === user?.email),
    [members, user?.email]
  );

  const currentUserRole = currentMembership?.role || 'member';
  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  const canRemoveMember = (member) => {
    if (!canManageMembers || !member) return false;
    if (member.role === 'owner') return false;
    if (member.email === user?.email) return false;
    if (member.role === 'admin' && currentUserRole !== 'owner') return false;
    return true;
  };

  return { currentUserRole, canManageMembers, canRemoveMember, currentMembership };
}
