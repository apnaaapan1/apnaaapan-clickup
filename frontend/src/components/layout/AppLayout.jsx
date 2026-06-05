import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useProjects from '../../hooks/useProjects';
import useNotifications from '../../hooks/useNotifications';
import useToast from '../../hooks/useToast';
import NotificationToast from '../notifications/NotificationToast';
import InviteModal from '../workspace/InviteModal';
import { openInviteModal } from '../../utils/inviteModal';
import TeamsSecondarySidebar from './TeamsSecondarySidebar';
import SidebarCollapseButton from './SidebarCollapseButton';
import CreateSpaceModal from '../space/CreateSpaceModal';
import RenameSpaceModal from '../space/RenameSpaceModal';
import RenameListModal from '../list/RenameListModal';
import CreateListModal from '../list/CreateListModal';
import ListBulletIcon from '../icons/ListBulletIcon';
import MoveListSpaceFlyout from '../list/MoveListSpaceFlyout';
import { getHiddenProjectIds } from '../../utils/sidebarSpaceVisibility';

export default function AppLayout() {
  const { user, workspaceId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, loading, refetch } = useProjects();
  const { toast, showToast, hideToast } = useToast();
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    isOpen,
    toggleDropdown,
    markOneAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(showToast);
  const [workspaceName, setWorkspaceName] = useState('Apnaaapan ClickUp');
  const [createSpaceModalOpen, setCreateSpaceModalOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [spacesSectionExpanded, setSpacesSectionExpanded] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState('member');
  const [memberCount, setMemberCount] = useState(0);
  const workspaceMenuRef = useRef(null);
  /** Which primary (blue) rail is active — drives the white secondary sidebar content. */
  const [activeRail, setActiveRail] = useState('home');
  const [secondaryRailOpen, setSecondaryRailOpen] = useState(true);
  /** list id → lists[] for sidebar tree */
  const [listsByProject, setListsByProject] = useState({});
  const [createListModalOpen, setCreateListModalOpen] = useState(false);
  const [createListDefaultProjectId, setCreateListDefaultProjectId] = useState(null);
  /** space id → false when collapsed (default expanded) */
  const [expandedSpaces, setExpandedSpaces] = useState({});
  /** Space row ⋯ menu: project id or null */
  const [openSpaceMenuId, setOpenSpaceMenuId] = useState(null);
  const [renameProject, setRenameProject] = useState(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [spacesSectionMenuOpen, setSpacesSectionMenuOpen] = useState(false);
  /** Bump when sidebar visibility (hidden spaces) changes in localStorage */
  const [sidebarSpaceVisRev, setSidebarSpaceVisRev] = useState(0);
  const [listDotsMenuId, setListDotsMenuId] = useState(null);
  const [listPlusMenuId, setListPlusMenuId] = useState(null);
  const [listMoveFlyoutKey, setListMoveFlyoutKey] = useState(null);
  const [moveListPendingKey, setMoveListPendingKey] = useState(null);
  const [creatingNewTask, setCreatingNewTask] = useState(false);
  const [renameListTarget, setRenameListTarget] = useState(null);
  const [deleteListTarget, setDeleteListTarget] = useState(null);
  const [deleteListLoading, setDeleteListLoading] = useState(false);

  const sidebarListsInFlight = useRef(false);
  const moveListAnchorRef = useRef(null);

  const visibleProjects = useMemo(() => {
    if (!workspaceId) return projects;
    const hidden = new Set(getHiddenProjectIds(workspaceId));
    return projects.filter((p) => !hidden.has(String(p.id)));
  }, [projects, workspaceId, sidebarSpaceVisRev]);

  const loadSidebarLists = useCallback(async () => {
    if (!workspaceId) {
      setListsByProject({});
      return;
    }
    if (sidebarListsInFlight.current) return;
    sidebarListsInFlight.current = true;
    try {
      const res = await api.get(`/workspaces/${workspaceId}/projects?includeLists=true`);
      const projs = res.data?.projects || [];
      const next = {};
      for (const p of projs) {
        next[p.id] = p.lists || [];
      }
      setListsByProject(next);
    } catch {
      setListsByProject({});
    } finally {
      sidebarListsInFlight.current = false;
    }
  }, [workspaceId]);

  useEffect(() => {
    loadSidebarLists();
  }, [loadSidebarLists]);

  useEffect(() => {
    const onListsChanged = () => loadSidebarLists();
    window.addEventListener('lists:changed', onListsChanged);
    return () => window.removeEventListener('lists:changed', onListsChanged);
  }, [loadSidebarLists]);

  const reloadWorkspaceMeta = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await api.get(`/workspaces/${workspaceId}`);
      if (res.data?.workspace?.name) {
        setWorkspaceName(res.data.workspace.name);
      }
      const members = res.data?.workspace?.members || [];
      setMemberCount(members.length);
      const myMembership = members.find((member) => member.email === user?.email);
      if (myMembership?.role) {
        setCurrentUserRole(myMembership.role);
      }
      window.dispatchEvent(new Event('workspace:members-changed'));
    } catch {
      // Keep fallback workspace name.
    }
  }, [workspaceId, user?.email]);

  useEffect(() => {
    reloadWorkspaceMeta();
  }, [reloadWorkspaceMeta]);

  useEffect(() => {
    if (location.pathname.startsWith('/teams')) {
      setActiveRail('teams');
      setSecondaryRailOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const onProjectsChanged = () => refetch();
    window.addEventListener('projects:changed', onProjectsChanged);
    return () => window.removeEventListener('projects:changed', onProjectsChanged);
  }, [refetch]);

  useEffect(() => {
    const onOutsideClick = (e) => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target)) {
        setWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  useEffect(() => {
    if (!openSpaceMenuId) return undefined;
    const onDown = (e) => {
      if (!e.target.closest?.('[data-space-actions-menu]')) {
        setOpenSpaceMenuId(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openSpaceMenuId]);

  useEffect(() => {
    if (!openSpaceMenuId) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenSpaceMenuId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openSpaceMenuId]);

  useEffect(() => {
    const bump = () => setSidebarSpaceVisRev((n) => n + 1);
    window.addEventListener('sidebar-spaces:changed', bump);
    return () => window.removeEventListener('sidebar-spaces:changed', bump);
  }, []);

  useEffect(() => {
    if (!spacesSectionMenuOpen) return undefined;
    const onDown = (e) => {
      if (!e.target.closest?.('[data-spaces-section-menu]')) {
        setSpacesSectionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [spacesSectionMenuOpen]);

  useEffect(() => {
    if (!spacesSectionMenuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setSpacesSectionMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [spacesSectionMenuOpen]);

  useEffect(() => {
    if (!listDotsMenuId && !listPlusMenuId) return undefined;
    const onDown = (e) => {
      if (
        !e.target.closest?.('[data-list-sidebar-menu]') &&
        !e.target.closest?.('[data-move-list-flyout]')
      ) {
        setListDotsMenuId(null);
        setListPlusMenuId(null);
        setListMoveFlyoutKey(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [listDotsMenuId, listPlusMenuId]);

  useEffect(() => {
    if (!listDotsMenuId && !listPlusMenuId) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setListDotsMenuId(null);
        setListPlusMenuId(null);
        setListMoveFlyoutKey(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [listDotsMenuId, listPlusMenuId]);

  useEffect(() => {
    const onInviteOpen = () => {
      setInviteOpen(true);
    };
    const onInviteClose = () => {
      setInviteOpen(false);
    };
    window.addEventListener('invite:open', onInviteOpen);
    window.addEventListener('invite:close', onInviteClose);
    return () => {
      window.removeEventListener('invite:open', onInviteOpen);
      window.removeEventListener('invite:close', onInviteClose);
    };
  }, []);

  const workspaceInitial = useMemo(
    () => (workspaceName?.trim()?.[0] || 'A').toUpperCase(),
    [workspaceName]
  );
  const userInitials = useMemo(() => {
    const parts = (user?.name || 'User').trim().split(/\s+/);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  }, [user]);

  const handleSpaceCreated = async () => {
    await refetch();
    window.dispatchEvent(new Event('projects:changed'));
    await loadSidebarLists();
  };

  const openCreateListModal = (projectId) => {
    setCreateListDefaultProjectId(projectId);
    setCreateListModalOpen(true);
  };

  const handleSpaceRenamed = async () => {
    await refetch();
    window.dispatchEvent(new Event('projects:changed'));
    await loadSidebarLists();
  };

  const handleDeleteSpace = async (project) => {
    if (!workspaceId || !project?.id) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/workspaces/${workspaceId}/projects/${project.id}`);
      setDeleteConfirmProject(null);
      setOpenSpaceMenuId(null);
      setExpandedSpaces((s) => {
        const next = { ...s };
        delete next[project.id];
        return next;
      });
      setListsByProject((prev) => {
        const next = { ...prev };
        delete next[project.id];
        return next;
      });
      await refetch();
      window.dispatchEvent(new Event('projects:changed'));
      await loadSidebarLists();
      if (location.pathname.startsWith(`/projects/${project.id}`)) {
        navigate('/projects');
      }
      showToast({
        id: `space-deleted-${project.id}`,
        title: 'Space deleted',
        message: `"${project.name}" was removed.`,
      });
    } catch (err) {
      showToast({
        id: `space-delete-err-${Date.now()}`,
        title: 'Could not delete space',
        message: err.response?.data?.message || 'Something went wrong. Try again.',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleListRenamed = async () => {
    await loadSidebarLists();
    window.dispatchEvent(new Event('lists:changed'));
  };

  const handleDeleteList = async () => {
    if (!workspaceId || !deleteListTarget) return;
    const { projectId, list } = deleteListTarget;
    const listIdStr = String(list.id);
    setDeleteListLoading(true);
    try {
      await api.delete(`/workspaces/${workspaceId}/projects/${projectId}/lists/${list.id}`);
      setDeleteListTarget(null);
      setListDotsMenuId(null);
      setListPlusMenuId(null);
      await loadSidebarLists();
      window.dispatchEvent(new Event('lists:changed'));
      const { pathname, search } = location;
      if (pathname.includes(String(projectId)) && search.includes(`list=${listIdStr}`)) {
        navigate(`/projects/${projectId}`);
      }
      showToast({
        id: `list-deleted-${list.id}`,
        title: 'List deleted',
        message: `"${list.name}" was removed.`,
      });
    } catch (err) {
      showToast({
        id: `list-delete-err-${Date.now()}`,
        title: 'Could not delete list',
        message: err.response?.data?.message || 'Something went wrong. Try again.',
      });
    } finally {
      setDeleteListLoading(false);
    }
  };

  const listRowKey = (projectId, listId) => `${projectId}:${listId}`;

  const handleMoveListToSpace = async (sourceProjectId, list, targetProjectId) => {
    if (!workspaceId || !list?.id) return;
    const lk = listRowKey(sourceProjectId, list.id);
    setMoveListPendingKey(lk);
    try {
      await api.patch(
        `/workspaces/${workspaceId}/projects/${sourceProjectId}/lists/${list.id}/move`,
        { targetProjectId }
      );
      setListDotsMenuId(null);
      setListMoveFlyoutKey(null);
      setMoveListPendingKey(null);
      await loadSidebarLists();
      window.dispatchEvent(new Event('lists:changed'));
      const listIdStr = String(list.id);
      const { pathname, search } = location;
      if (
        pathname.includes(String(sourceProjectId)) &&
        search.includes(`list=${listIdStr}`)
      ) {
        navigate(`/projects/${targetProjectId}?list=${list.id}`);
      }
      showToast({
        id: `list-moved-${list.id}-${targetProjectId}`,
        title: 'List moved',
        message: `"${list.name}" was moved to another space.`,
      });
    } catch (err) {
      setMoveListPendingKey(null);
      showToast({
        id: `list-move-err-${Date.now()}`,
        title: 'Could not move list',
        message: err.response?.data?.message || 'Something went wrong. Try again.',
      });
    }
  };

  const railBtn =
    'flex flex-col items-center justify-center w-[52px] py-2 rounded-xl gap-0.5 text-[10px] font-medium transition-colors';
  const railActive = 'bg-white text-indigo-900 shadow-sm';
  const railInactive = 'text-white hover:bg-white/10';

  const outletContext = useMemo(
    () => ({
      notificationBellProps: {
        notifications,
        unreadCount,
        loading: notificationsLoading,
        isOpen,
        toggleDropdown,
        markOneAsRead,
        markAllAsRead,
        deleteNotification,
      },
    }),
    [
      notifications,
      unreadCount,
      notificationsLoading,
      isOpen,
      toggleDropdown,
      markOneAsRead,
      markAllAsRead,
      deleteNotification,
    ]
  );

  return (
    <div className="h-screen flex overflow-hidden bg-[#f7f7fa]">
      <aside className="w-[72px] h-full shrink-0 flex flex-col items-center py-3 gap-1 bg-gradient-to-b from-indigo-700 to-indigo-900 text-white">
        <button
          type="button"
          onClick={() => {
            setActiveRail('home');
            setSecondaryRailOpen(true);
            navigate('/');
          }}
          className={`${railBtn} ${activeRail === 'home' ? railActive : railInactive}`}
          title="Home"
        >
          <span className="text-lg leading-none">🏠</span>
          <span>Home</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveRail('teams');
            setSecondaryRailOpen(true);
            navigate('/teams/people');
          }}
          className={`${railBtn} ${activeRail === 'teams' ? railActive : railInactive}`}
          title="Teams"
        >
          <span className="text-lg leading-none">👥</span>
          <span>Teams</span>
        </button>
        <div
          className={`${railBtn} text-white/40 cursor-not-allowed`}
          title="Coming soon"
          aria-disabled="true"
        >
          <span className="text-lg leading-none">🗓</span>
          <span>Planner</span>
        </div>
        <div
          className={`${railBtn} text-white/40 cursor-not-allowed`}
          title="Coming soon"
          aria-disabled="true"
        >
          <span className="text-lg leading-none">✨</span>
          <span>AI</span>
        </div>
        <div
          className={`${railBtn} text-white/40 cursor-not-allowed`}
          title="Coming soon"
          aria-disabled="true"
        >
          <span className="text-lg leading-none">⋯</span>
          <span>More</span>
        </div>
        <div className="flex-1 min-h-[8px]" />
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-[52px] py-2 rounded-xl gap-0.5 text-[10px] font-semibold overflow-hidden transition-colors ${
              isActive ? 'bg-white/25 ring-2 ring-white/40 text-white' : 'text-white hover:bg-white/10'
            }`
          }
          title="Profile"
        >
          <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-[11px]">
            {userInitials}
          </span>
          <span>Profile</span>
        </NavLink>
      </aside>

      <div className="flex flex-1 min-w-0 min-h-0">
        {!secondaryRailOpen && (
          <button
            type="button"
            onClick={() => setSecondaryRailOpen(true)}
            className="shrink-0 w-7 flex flex-col items-center justify-center border-r border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <aside
          className={`h-full bg-white border-r border-gray-200 flex flex-col relative overflow-hidden transition-[width] duration-200 ease-out shrink-0 ${
            secondaryRailOpen ? 'w-[310px]' : 'w-0 border-r-0'
          }`}
        >
        {activeRail === 'home' && secondaryRailOpen && (
          <>
        <div className="relative px-3 py-2.5 border-b border-gray-200 shrink-0 bg-white" ref={workspaceMenuRef}>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setWorkspaceMenuOpen((prev) => !prev)}
              className="flex-1 min-w-0 h-8 rounded-md border border-gray-200 px-2 flex items-center gap-2 hover:bg-gray-50 text-left"
              aria-expanded={workspaceMenuOpen}
              aria-haspopup="true"
              aria-label={workspaceMenuOpen ? 'Collapse workspace menu' : 'Expand workspace menu'}
            >
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold shrink-0">
                {workspaceInitial}
              </div>
              <span className="text-sm font-semibold text-gray-800 truncate">{workspaceName}</span>
              <svg
                className={`w-4 h-4 text-gray-600 ml-auto shrink-0 transition-transform duration-200 ease-out ${
                  workspaceMenuOpen ? 'rotate-180' : ''
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <SidebarCollapseButton onClick={() => setSecondaryRailOpen(false)} />
          </div>

          {workspaceMenuOpen && (
            <div className="absolute left-2 right-2 top-[52px] z-40 bg-white rounded-xl border border-gray-200 shadow-lg p-3">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-base font-semibold">
                  {workspaceInitial}
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-gray-800">{workspaceName}</p>
                  <p className="text-[12px] text-gray-500">
                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    navigate('/workspace');
                  }}
                  className="h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ⚙ Settings
                </button>
                <button
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    openInviteModal();
                  }}
                  className="h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Invite
                </button>
              </div>
              <button className="mt-3 w-full h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                + Create Workspace
              </button>
            </div>
          )}
        </div>

        <div className="sidebar-scroll px-3 py-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="text-base font-semibold text-gray-900">Home</h2>
            <button
              type="button"
              onClick={() => setCreateSpaceModalOpen(true)}
              className="shrink-0 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
            >
              + Create
            </button>
          </div>

          <nav className="space-y-0.5 text-sm text-gray-700">
            <NavLink to="/inbox" className={({ isActive }) => `block px-2 py-1.5 rounded-md ${isActive ? 'bg-gray-100 font-medium text-gray-900' : 'hover:bg-gray-50 text-gray-700'}`}>Inbox</NavLink>
            <NavLink to="/replies" className={({ isActive }) => `block px-2 py-1.5 rounded-md ${isActive ? 'bg-gray-100 font-medium text-gray-900' : 'hover:bg-gray-50 text-gray-700'}`}>Replies</NavLink>
            <NavLink to="/my-tasks" className={({ isActive }) => `block px-2 py-1.5 rounded-md ${isActive ? 'bg-gray-100 font-medium text-gray-900' : 'hover:bg-gray-50 text-gray-700'}`}>My Tasks</NavLink>
          </nav>

          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 -mx-2 group hover:bg-gray-100/90 transition-colors">
              <div className="flex items-center gap-1 min-w-0">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-500 shrink-0">Spaces</p>
                <button
                  type="button"
                  onClick={() => setSpacesSectionExpanded((v) => !v)}
                  className="shrink-0 p-0.5 rounded text-gray-500 hover:bg-gray-200/80 hover:text-gray-700 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto transition-opacity duration-150"
                  aria-expanded={spacesSectionExpanded}
                  title={spacesSectionExpanded ? 'Collapse spaces' : 'Expand spaces'}
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-150 ${spacesSectionExpanded ? '' : '-rotate-90'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <div
                className={`flex items-center gap-1.5 shrink-0 transition-opacity duration-150 group-focus-within:opacity-100 group-focus-within:pointer-events-auto ${
                  spacesSectionMenuOpen
                    ? 'opacity-100 pointer-events-auto'
                    : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto'
                }`}
              >
                <div className="relative shrink-0" data-spaces-section-menu>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-200/80 hover:text-gray-700 flex items-center justify-center text-base leading-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
                    title="Spaces options"
                    aria-expanded={spacesSectionMenuOpen}
                    aria-haspopup="menu"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSpacesSectionMenuOpen((v) => !v);
                    }}
                  >
                    ⋯
                  </button>
                  {spacesSectionMenuOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 top-full z-[60] mt-1 min-w-[11rem] rounded-lg border border-gray-200 bg-white py-1.5 shadow-lg"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full px-3.5 py-2.5 text-left text-[15px] text-gray-800 hover:bg-gray-50"
                        onClick={() => {
                          setSpacesSectionMenuOpen(false);
                          setCreateSpaceModalOpen(true);
                        }}
                      >
                        Create space
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full px-3.5 py-2.5 text-left text-[15px] text-gray-800 hover:bg-gray-50"
                        onClick={() => {
                          setSpacesSectionMenuOpen(false);
                          navigate('/spaces/manage');
                        }}
                      >
                        Manage spaces
                      </button>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setCreateSpaceModalOpen(true)}
                  className="w-7 h-7 rounded-md border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 flex items-center justify-center text-base font-semibold leading-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
                  title="Add Space"
                >
                  +
                </button>
              </div>
            </div>
            {spacesSectionExpanded && (
              <>
                <NavLink
                  to="/projects"
                  className={({ isActive }) =>
                    `block px-2 py-1.5 rounded-md text-sm ${
                      isActive ? 'bg-gray-100 font-medium text-gray-900' : 'hover:bg-gray-50 text-gray-700'
                    }`
                  }
                >
                  All Spaces
                </NavLink>
                <div className="space-y-0.5">
                  {visibleProjects.map((project) => {
                    const lists = listsByProject[project.id] || [];
                    const expanded = expandedSpaces[project.id] !== false;
                    return (
                      <div key={project.id}>
                        <div className="group flex items-center gap-0.5 rounded-lg px-1 py-0.5 hover:bg-gray-50/90">
                          <button
                            type="button"
                            className="shrink-0 p-0.5 rounded text-gray-500 hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto transition-opacity duration-150"
                            aria-expanded={expanded}
                            title={expanded ? 'Collapse lists' : 'Expand lists'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedSpaces((s) => ({
                                ...s,
                                [project.id]: !expanded,
                              }));
                            }}
                          >
                            <svg
                              className={`w-3.5 h-3.5 transition-transform duration-150 ${expanded ? '' : '-rotate-90'}`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="flex-1 min-w-0 flex items-center gap-2 py-1 px-1 rounded text-left"
                          >
                            <span className="w-5 h-5 shrink-0 rounded bg-emerald-500 text-white text-[11px] flex items-center justify-center">
                              {(project.name || 'P').trim().charAt(0).toUpperCase()}
                            </span>
                            <span className="truncate text-sm font-medium text-gray-900">{project.name}</span>
                          </button>
                          <div
                            className={`shrink-0 flex items-center gap-1 transition-opacity duration-150 group-focus-within:opacity-100 group-focus-within:pointer-events-auto ${
                              openSpaceMenuId === project.id
                                ? 'opacity-100 pointer-events-auto'
                                : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                            }`}
                          >
                            <div className="relative shrink-0" data-space-actions-menu>
                              <button
                                type="button"
                                className="w-9 h-9 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center text-xl leading-none tracking-wide focus-visible:ring-2 focus-visible:ring-violet-400/50"
                                title="Space options"
                                aria-expanded={openSpaceMenuId === project.id}
                                aria-haspopup="menu"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenSpaceMenuId((id) => (id === project.id ? null : project.id));
                                }}
                              >
                                ⋯
                              </button>
                              {openSpaceMenuId === project.id ? (
                                <div
                                  role="menu"
                                  className="absolute right-0 top-full z-[60] mt-1 min-w-[11rem] rounded-lg border border-gray-200 bg-white py-1.5 shadow-lg"
                                >
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className="w-full px-3.5 py-2.5 text-left text-[15px] text-gray-800 hover:bg-gray-50"
                                    onClick={() => {
                                      setOpenSpaceMenuId(null);
                                      setRenameProject(project);
                                    }}
                                  >
                                    Rename
                                  </button>
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className="w-full px-3.5 py-2.5 text-left text-[15px] text-gray-800 hover:bg-gray-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenSpaceMenuId(null);
                                      openCreateListModal(project.id);
                                    }}
                                  >
                                    New list
                                  </button>
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className="w-full px-3.5 py-2.5 text-left text-[15px] text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      setOpenSpaceMenuId(null);
                                      setDeleteConfirmProject(project);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              className="w-9 h-9 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 flex items-center justify-center text-xl font-semibold leading-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
                              title="Add new list"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCreateListModal(project.id);
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        {expanded && (
                          <ul className="ml-5 mt-0.5 mb-1 pl-2 border-l border-gray-100 space-y-0.5">
                            {lists.map((list) => {
                              const lk = listRowKey(project.id, list.id);
                              const dotsOpen = listDotsMenuId === lk;
                              const plusOpen = listPlusMenuId === lk;
                              const menusOpen = dotsOpen || plusOpen;
                              return (
                                <li key={list.id} className="group/listitem">
                                  <div className="flex items-center gap-0.5 rounded-lg px-1 py-0.5 hover:bg-gray-50/90">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        navigate(`/projects/${project.id}?list=${list.id}`)
                                      }
                                      className="flex-1 min-w-0 flex items-center gap-2 py-1 px-1 rounded text-left"
                                    >
                                      <ListBulletIcon className="w-4 h-4 shrink-0 text-gray-400" />
                                      <span className="truncate text-[15px] font-medium text-gray-900 min-w-0">
                                        {list.name}
                                      </span>
                                    </button>
                                    <div
                                      className={`shrink-0 flex items-center gap-1 transition-opacity duration-150 group-focus-within/listitem:opacity-100 group-focus-within/listitem:pointer-events-auto ${
                                        menusOpen
                                          ? 'opacity-100 pointer-events-auto'
                                          : 'opacity-0 pointer-events-none group-hover/listitem:opacity-100 group-hover/listitem:pointer-events-auto'
                                      }`}
                                    >
                                      <div className="relative shrink-0" data-list-sidebar-menu>
                                        <button
                                          type="button"
                                          className="w-9 h-9 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center text-xl leading-none tracking-wide focus-visible:ring-2 focus-visible:ring-violet-400/50"
                                          title="List options"
                                          aria-expanded={dotsOpen}
                                          aria-haspopup="menu"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setListPlusMenuId(null);
                                            setListMoveFlyoutKey(null);
                                            setListDotsMenuId((id) => (id === lk ? null : lk));
                                          }}
                                        >
                                          ⋯
                                        </button>
                                        {dotsOpen ? (
                                          <div
                                            role="menu"
                                            className="absolute right-0 top-full z-[60] mt-1 min-w-[10.5rem] rounded-lg border border-gray-200 bg-white py-1.5 shadow-lg overflow-visible"
                                          >
                                            <button
                                              type="button"
                                              role="menuitem"
                                              className="w-full px-3.5 py-2.5 text-left text-[15px] text-gray-800 hover:bg-gray-50"
                                              onClick={() => {
                                                setListDotsMenuId(null);
                                                setListMoveFlyoutKey(null);
                                                setRenameListTarget({ projectId: project.id, list });
                                              }}
                                            >
                                              Rename list
                                            </button>
                                            <div className="relative">
                                              <button
                                                ref={listMoveFlyoutKey === lk ? moveListAnchorRef : undefined}
                                                type="button"
                                                role="menuitem"
                                                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[15px] text-gray-800 hover:bg-gray-50"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setListMoveFlyoutKey((k) => (k === lk ? null : lk));
                                                }}
                                              >
                                                <span className="flex items-center gap-2 min-w-0">
                                                  <svg
                                                    className="w-4 h-4 shrink-0 text-gray-500"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                    aria-hidden
                                                  >
                                                    <path d="M3 10.75a.75.75 0 001.5 0V6.56l1.22 1.22a.75.75 0 101.06-1.06l-2.5-2.5a.75.75 0 00-1.06 0l-2.5 2.5a.75.75 0 001.06 1.06L3 6.56v4.19zM17 9.25a.75.75 0 00-1.5 0v4.19l-1.22-1.22a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.06 0l2.5-2.5a.75.75 0 10-1.06-1.06L17 13.44V9.25zM10 3a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V3.75A.75.75 0 0110 3z" />
                                                  </svg>
                                                  <span className="truncate">Move list</span>
                                                </span>
                                                <svg
                                                  className="w-4 h-4 shrink-0 text-gray-400"
                                                  viewBox="0 0 20 20"
                                                  fill="currentColor"
                                                  aria-hidden
                                                >
                                                  <path
                                                    fillRule="evenodd"
                                                    d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z"
                                                    clipRule="evenodd"
                                                  />
                                                </svg>
                                              </button>
                                              {listMoveFlyoutKey === lk ? (
                                                <MoveListSpaceFlyout
                                                  anchorRef={moveListAnchorRef}
                                                  anchorActiveKey={lk}
                                                  projects={projects}
                                                  sourceProjectId={project.id}
                                                  moving={moveListPendingKey === lk}
                                                  onSelectSpace={(tid) =>
                                                    handleMoveListToSpace(project.id, list, tid)
                                                  }
                                                />
                                              ) : null}
                                            </div>
                                            <button
                                              type="button"
                                              role="menuitem"
                                              className="w-full px-3.5 py-2.5 text-left text-[15px] text-red-600 hover:bg-red-50"
                                              onClick={() => {
                                                setListDotsMenuId(null);
                                                setListMoveFlyoutKey(null);
                                                setDeleteListTarget({ projectId: project.id, list });
                                              }}
                                            >
                                              Delete list
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                      <div className="relative shrink-0" data-list-sidebar-menu>
                                        <button
                                          type="button"
                                          className="w-9 h-9 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 flex items-center justify-center text-xl font-semibold leading-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
                                          title="Add to list"
                                          aria-expanded={plusOpen}
                                          aria-haspopup="menu"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setListDotsMenuId(null);
                                            setListPlusMenuId((id) => (id === lk ? null : lk));
                                          }}
                                        >
                                          +
                                        </button>
                                        {plusOpen ? (
                                          <div
                                            role="menu"
                                            className="absolute right-0 top-full z-[60] mt-1 min-w-[11rem] rounded-lg border border-gray-200 bg-white py-1.5 shadow-lg"
                                          >
                                            <button
                                              type="button"
                                              role="menuitem"
                                              className="w-full px-3.5 py-2.5 text-left text-[15px] text-gray-800 hover:bg-gray-50"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setListPlusMenuId(null);
                                                openCreateListModal(project.id);
                                              }}
                                            >
                                              Create new list
                                            </button>
                                            <button
                                              type="button"
                                              role="menuitem"
                                              className="w-full px-3.5 py-2.5 text-left text-[15px] text-gray-800 hover:bg-gray-50"
                                              disabled={creatingNewTask}
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                setListPlusMenuId(null);
                                                if (creatingNewTask) return;
                                                setCreatingNewTask(true);
                                                try {
                                                  const res = await api.post(
                                                    `/workspaces/${workspaceId}/projects/${project.id}/lists/${list.id}/tasks`,
                                                    { title: 'Untitled task', priority: 'medium' }
                                                  );
                                                  const newTask = res.data?.task;
                                                  window.dispatchEvent(new Event('tasks:changed'));
                                                  if (newTask?.id) {
                                                    navigate(
                                                      `/projects/${project.id}?list=${list.id}&openTask=${newTask.id}&openTaskList=${list.id}`
                                                    );
                                                  }
                                                } catch {
                                                  showToast({
                                                    id: `task-create-err-${Date.now()}`,
                                                    title: 'Could not create task',
                                                    message: 'Something went wrong. Try again.',
                                                  });
                                                } finally {
                                                  setCreatingNewTask(false);
                                                }
                                              }}
                                            >
                                              New task
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                            {lists.length === 0 && (
                              <li className="py-1 px-2 text-xs text-gray-400">No lists yet</li>
                            )}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setCreateSpaceModalOpen(true)}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-50 text-gray-500 text-sm font-medium"
                  >
                    + New Space
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-gray-200">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Channels</p>
            <button className="w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-50 text-sm text-gray-700">
              + Add Channel <span className="text-xs text-gray-400 ml-2">Coming soon</span>
            </button>
          </div>
        </div>
          </>
        )}

        {activeRail === 'teams' && secondaryRailOpen && (
          <TeamsSecondarySidebar
            memberCount={memberCount}
            onCollapseSidebar={() => setSecondaryRailOpen(false)}
          />
        )}

      </aside>

      <main className="flex-1 overflow-y-auto min-w-0" style={{ background: '#f8f7ff' }}>
        <Outlet context={outletContext} />
      </main>
      </div>
      {toast && <NotificationToast notification={toast} onClose={hideToast} />}
      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={() => {
          refetch();
          reloadWorkspaceMeta();
        }}
        canInvite={currentUserRole === 'owner' || currentUserRole === 'admin'}
      />
      <CreateSpaceModal
        isOpen={createSpaceModalOpen}
        onClose={() => setCreateSpaceModalOpen(false)}
        onCreated={handleSpaceCreated}
      />
      <RenameSpaceModal
        isOpen={Boolean(renameProject)}
        project={renameProject}
        onClose={() => setRenameProject(null)}
        onRenamed={handleSpaceRenamed}
      />
      {deleteConfirmProject ? (
        <div
          className="fixed inset-0 z-[86] flex items-center justify-center p-4 bg-black/40"
          onClick={() => !deleteLoading && setDeleteConfirmProject(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="delete-space-title"
            aria-modal="true"
          >
            <div className="px-6 pt-6 pb-4">
              <h2 id="delete-space-title" className="text-lg font-semibold text-gray-900">
                Delete space?
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium text-gray-900">{deleteConfirmProject.name}</span> and all
                of its lists and tasks will be permanently removed. This cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteConfirmProject(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSpace(deleteConfirmProject)}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting…' : 'Delete space'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <RenameListModal
        isOpen={Boolean(renameListTarget)}
        projectId={renameListTarget?.projectId}
        list={renameListTarget?.list}
        onClose={() => setRenameListTarget(null)}
        onRenamed={handleListRenamed}
      />
      {deleteListTarget ? (
        <div
          className="fixed inset-0 z-[86] flex items-center justify-center p-4 bg-black/40"
          onClick={() => !deleteListLoading && setDeleteListTarget(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="delete-list-title"
            aria-modal="true"
          >
            <div className="px-6 pt-6 pb-4">
              <h2 id="delete-list-title" className="text-lg font-semibold text-gray-900">
                Delete list?
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium text-gray-900">{deleteListTarget.list.name}</span> and all
                tasks in this list will be permanently removed.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteListTarget(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={deleteListLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteList()}
                disabled={deleteListLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteListLoading ? 'Deleting…' : 'Delete list'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <CreateListModal
        isOpen={createListModalOpen}
        onClose={() => {
          setCreateListModalOpen(false);
          setCreateListDefaultProjectId(null);
        }}
        projects={projects}
        defaultProjectId={createListDefaultProjectId}
        onCreated={() => {
          loadSidebarLists();
          window.dispatchEvent(new Event('lists:changed'));
        }}
      />
    </div>
  );
}
