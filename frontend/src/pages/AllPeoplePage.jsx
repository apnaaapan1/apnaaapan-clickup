import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import RemoveMemberConfirmModal from '../components/workspace/RemoveMemberConfirmModal';
import useWorkspaceMembers from '../hooks/useWorkspaceMembers';
import { useWorkspaceRole } from '../hooks/useWorkspaceRole';
import { openInviteModal } from '../utils/inviteModal';
import {
  formatMemberRole,
  formatMemberStatus,
  getMemberAvatarColor,
  getMemberInitials,
} from '../utils/memberDisplay';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
];

const ROLE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'email-asc', label: 'Email (A–Z)' },
  { value: 'role-asc', label: 'Role' },
];

function FilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        <span>{label === 'Sort' ? selected.label : label}</span>
        {label !== 'Sort' && value !== 'all' ? (
          <span className="text-xs text-violet-600">· {selected.label}</span>
        ) : null}
        <span className="text-[10px] text-gray-400" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[10rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                value === opt.value ? 'bg-violet-50 text-violet-700 font-medium' : 'text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AssignSlotButton({ label, title, variant = 'person' }) {
  return (
    <button
      type="button"
      disabled
      title={title}
      aria-label={label}
      className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-gray-400 transition-colors disabled:cursor-not-allowed"
    >
      {variant === 'team' ? (
        <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="7" r="3.25" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="7" r="3.25" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      )}
      <span
        className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-400 text-white"
        aria-hidden
      >
        <svg className="h-2 w-2" viewBox="0 0 8 8" fill="none">
          <path d="M4 1v6M1 4h6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      </span>
    </button>
  );
}

function MemberAvatar({ member }) {
  const initials = getMemberInitials(member.name, member.email);
  const colorClass = getMemberAvatarColor(member.email || member.name);
  const isActive = !member.status || member.status === 'active';

  return (
    <div className="relative shrink-0">
      {member.avatar_url ? (
        <img
          src={member.avatar_url}
          alt=""
          className="h-8 w-8 rounded-full object-cover"
        />
      ) : (
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${colorClass}`}
        >
          {initials}
        </div>
      )}
      <span
        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${
          isActive ? 'bg-emerald-500' : member.status === 'suspended' ? 'bg-red-400' : 'bg-gray-300'
        }`}
        title={formatMemberStatus(member.status)}
      />
    </div>
  );
}

export default function AllPeoplePage() {
  const { workspaceId } = useAuth();
  const { members, loading, refetch } = useWorkspaceMembers();
  const { canRemoveMember } = useWorkspaceRole(members);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [viewMode, setViewMode] = useState('list');
  const [openRowMenuId, setOpenRowMenuId] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const rowMenuRef = useRef(null);

  useEffect(() => {
    const onMembersChanged = () => refetch();
    window.addEventListener('workspace:members-changed', onMembersChanged);
    return () => window.removeEventListener('workspace:members-changed', onMembersChanged);
  }, [refetch]);

  useEffect(() => {
    if (!openRowMenuId) return undefined;
    const onDown = (e) => {
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target)) {
        setOpenRowMenuId(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openRowMenuId]);

  const handleConfirmRemove = async () => {
    if (!workspaceId || !removeTarget) return;
    setRemoveLoading(true);
    setActionError('');
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${removeTarget.id}`);
      setRemoveTarget(null);
      setOpenRowMenuId(null);
      await refetch();
      window.dispatchEvent(new Event('workspace:members-changed'));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemoveLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    let list = [...members];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          (m.name || '').toLowerCase().includes(q) ||
          (m.email || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((m) => (m.status || 'active') === statusFilter);
    }
    if (roleFilter !== 'all') {
      list = list.filter((m) => m.role === roleFilter);
    }
    list.sort((a, b) => {
      const nameA = (a.name || a.email || '').toLowerCase();
      const nameB = (b.name || b.email || '').toLowerCase();
      const emailA = (a.email || '').toLowerCase();
      const emailB = (b.email || '').toLowerCase();
      switch (sortBy) {
        case 'name-desc':
          return nameB.localeCompare(nameA);
        case 'email-asc':
          return emailA.localeCompare(emailB);
        case 'role-asc':
          return (a.role || '').localeCompare(b.role || '');
        default:
          return nameA.localeCompare(nameB);
      }
    });
    return list;
  }, [members, search, statusFilter, roleFilter, sortBy]);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">All People</h1>
        <button
          type="button"
          onClick={openInviteModal}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Invite
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-6 py-3">
        <FilterDropdown
          label="Status"
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
        />
        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-400"
        >
          Team <span className="text-[10px]">▾</span>
        </button>
        <FilterDropdown
          label="Account type"
          value={roleFilter}
          options={ROLE_OPTIONS}
          onChange={setRoleFilter}
        />
        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-400"
        >
          Manager <span className="text-[10px]">▾</span>
        </button>
        <FilterDropdown label="Sort" value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />

        <div className="ml-auto flex min-w-[200px] flex-1 items-center justify-end gap-2 sm:max-w-md">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full rounded-lg border border-gray-200 py-1.5 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div className="flex rounded-lg border border-gray-200 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-md p-1.5 ${
                viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="List view"
              aria-pressed={viewMode === 'list'}
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <rect x="2" y="3" width="12" height="1.5" rx="0.5" />
                <rect x="2" y="7.25" width="12" height="1.5" rx="0.5" />
                <rect x="2" y="11.5" width="12" height="1.5" rx="0.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1.5 ${
                viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <rect x="2" y="2" width="5" height="5" rx="1" />
                <rect x="9" y="2" width="5" height="5" rx="1" />
                <rect x="2" y="9" width="5" height="5" rx="1" />
                <rect x="9" y="9" width="5" height="5" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {actionError ? (
          <p className="px-6 pt-3 text-sm text-red-600">{actionError}</p>
        ) : null}
        {loading ? (
          <p className="px-6 py-12 text-center text-sm text-gray-500">Loading people…</p>
        ) : filteredMembers.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-500">
            {members.length === 0
              ? 'No people in this workspace yet. Invite someone to get started.'
              : 'No people match your filters.'}
          </p>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <MemberAvatar member={member} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {member.name || member.email}
                    </p>
                    <p className="truncate text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{formatMemberRole(member.role)}</span>
                  {' · '}
                  {formatMemberStatus(member.status)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-2.5 text-xs font-medium text-gray-500">Name</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Manager</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Teams</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Email</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Role</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500">User Status</th>
                <th className="w-12 px-4 py-2.5 text-xs font-medium text-gray-500">
                  <span className="sr-only">Actions</span>
                  <span className="text-gray-400" aria-hidden>
                    +
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, index) => (
                <tr
                  key={member.id}
                  className={`border-b border-gray-100 ${
                    index % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'
                  }`}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <MemberAvatar member={member} />
                      <span className="text-sm font-medium text-gray-900">
                        {member.name || member.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AssignSlotButton
                      label="Assign manager"
                      title="Assign manager (coming soon)"
                      variant="person"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <AssignSlotButton
                      label="Manage teams"
                      title="Manage teams (coming soon)"
                      variant="team"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{member.email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{formatMemberRole(member.role)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {member.status && member.status !== 'active'
                      ? formatMemberStatus(member.status)
                      : '—'}
                  </td>
                  <td className="relative px-4 py-3">
                    {canRemoveMember(member) ? (
                      <>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenRowMenuId((id) => (id === member.id ? null : member.id))
                      }
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      aria-label="More actions"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <circle cx="10" cy="4" r="1.5" />
                        <circle cx="10" cy="10" r="1.5" />
                        <circle cx="10" cy="16" r="1.5" />
                      </svg>
                    </button>
                    {openRowMenuId === member.id ? (
                      <div
                        ref={rowMenuRef}
                        className="absolute right-4 top-full z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenRowMenuId(null);
                            setRemoveTarget(member);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          Remove from workspace
                        </button>
                      </div>
                    ) : null}
                      </>
                    ) : (
                      <span className="text-gray-300" aria-hidden>
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RemoveMemberConfirmModal
        isOpen={Boolean(removeTarget)}
        member={removeTarget}
        loading={removeLoading}
        onClose={() => !removeLoading && setRemoveTarget(null)}
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
}
