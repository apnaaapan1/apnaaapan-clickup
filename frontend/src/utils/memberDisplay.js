const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-fuchsia-100 text-fuchsia-700',
];

export function getMemberInitials(name, email) {
  const source = (name || email || 'U').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function getMemberAvatarColor(seed) {
  const value = (seed || 'user').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[value % AVATAR_COLORS.length];
}

export function formatMemberRole(role) {
  if (!role) return 'Member';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function formatMemberStatus(status) {
  if (!status || status === 'active') return 'Active';
  if (status === 'invited') return 'Invited';
  if (status === 'suspended') return 'Suspended';
  return status.charAt(0).toUpperCase() + status.slice(1);
}
