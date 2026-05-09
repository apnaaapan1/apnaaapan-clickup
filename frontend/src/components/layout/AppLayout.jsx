import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useProjects from '../../hooks/useProjects';
import useNotifications from '../../hooks/useNotifications';
import useToast from '../../hooks/useToast';
import NotificationBell from '../notifications/NotificationBell';
import NotificationToast from '../notifications/NotificationToast';
import InviteModal from '../workspace/InviteModal';
import { openInviteModal } from '../../utils/inviteModal';
import TeamsSecondarySidebar from './TeamsSecondarySidebar';
import SidebarCollapseButton from './SidebarCollapseButton';
import CreateSpaceModal from '../space/CreateSpaceModal';
import CreateListModal from '../list/CreateListModal';

export default function AppLayout() {
  const { user, workspaceId } = useAuth();
  const navigate = useNavigate();
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

  const sidebarListsInFlight = useRef(false);

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

  useEffect(() => {
    const loadWorkspace = async () => {
      if (!workspaceId) return;
      try {
        const res = await api.get(`/workspaces/${workspaceId}`);
        if (res.data?.workspace?.name) {
          setWorkspaceName(res.data.workspace.name);
        }
        const members = res.data?.workspace?.members || [];
        setMemberCount(members.length);
        const myMembership = members.find(
          (member) => member.email === user?.email
        );
        if (myMembership?.role) {
          setCurrentUserRole(myMembership.role);
        }
      } catch {
        // Keep fallback workspace name.
      }
    };
    loadWorkspace();
  }, [workspaceId, user?.email]);

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

  const railBtn =
    'flex flex-col items-center justify-center w-[52px] py-2 rounded-xl gap-0.5 text-[10px] font-medium transition-colors';
  const railActive = 'bg-white text-indigo-900 shadow-sm';
  const railInactive = 'text-white hover:bg-white/10';

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
            secondaryRailOpen ? 'w-[330px]' : 'w-0 border-r-0'
          }`}
        >
        {activeRail === 'home' && secondaryRailOpen && (
          <>
        <div className="px-4 pt-3 pb-2 flex justify-end border-b border-gray-200 shrink-0 bg-white">
          <SidebarCollapseButton onClick={() => setSecondaryRailOpen(false)} />
        </div>
        <div className="px-4 py-3 border-b border-gray-200" ref={workspaceMenuRef}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWorkspaceMenuOpen((prev) => !prev)}
              className="flex-1 h-9 rounded-lg border border-gray-200 px-2.5 flex items-center gap-2 hover:bg-gray-50 text-left"
              aria-expanded={workspaceMenuOpen}
              aria-haspopup="true"
              aria-label={workspaceMenuOpen ? 'Collapse workspace menu' : 'Expand workspace menu'}
            >
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold shrink-0">
                {workspaceInitial}
              </div>
              <span className="text-[14px] font-semibold text-gray-800 truncate">{workspaceName}</span>
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
          </div>

          {workspaceMenuOpen && (
            <div className="absolute left-3 right-3 top-[56px] z-40 bg-white rounded-xl border border-gray-200 shadow-lg p-3">
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

        <div className="px-4 py-4 flex-1 min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-[32px] leading-none font-semibold text-gray-900">Home</h2>
            <button className="h-10 px-4 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700">
              + Create
            </button>
          </div>

          <div className="mt-5 space-y-2 text-gray-700">
            <NavLink to="/inbox" className={({ isActive }) => `block px-2 py-1.5 rounded ${isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}>Inbox</NavLink>
            <NavLink to="/replies" className={({ isActive }) => `block px-2 py-1.5 rounded ${isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}>Replies</NavLink>
            <NavLink to="/my-tasks" className={({ isActive }) => `block px-2 py-1.5 rounded ${isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}>My Tasks</NavLink>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 -mx-2 group hover:bg-gray-100/90 transition-colors">
              <div className="flex items-center gap-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-600 shrink-0">Spaces</p>
                <button
                  type="button"
                  onClick={() => setSpacesSectionExpanded((v) => !v)}
                  className="shrink-0 p-0.5 rounded text-gray-500 hover:bg-gray-200/80 hover:text-gray-700 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto transition-opacity duration-150"
                  aria-expanded={spacesSectionExpanded}
                  title={spacesSectionExpanded ? 'Collapse spaces' : 'Expand spaces'}
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${spacesSectionExpanded ? '' : '-rotate-90'}`}
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
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  className="w-7 h-7 rounded text-gray-500 hover:bg-gray-200/80 hover:text-gray-700 flex items-center justify-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto transition-opacity duration-150"
                  title="More"
                >
                  ⋯
                </button>
                <button
                  type="button"
                  onClick={() => setCreateSpaceModalOpen(true)}
                  className="w-7 h-7 rounded-md border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 flex items-center justify-center text-lg leading-none font-medium"
                  title="Add Space"
                >
                  +
                </button>
              </div>
            </div>
            {spacesSectionExpanded && (
              <>
                <NavLink to="/projects" className={({ isActive }) => `block px-2 py-1.5 rounded ${isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}>
                  All Spaces
                </NavLink>
                <div className="space-y-0.5">
                  {projects.map((project) => {
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
                            <span className="truncate text-sm text-gray-800">{project.name}</span>
                          </button>
                          <div className="shrink-0 flex items-center gap-0.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150">
                            <button
                              type="button"
                              className="w-7 h-7 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center"
                              title="More"
                            >
                              ⋯
                            </button>
                            <button
                              type="button"
                              className="w-7 h-7 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center text-base leading-none font-medium"
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
                            {lists.map((list) => (
                              <li key={list.id}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/projects/${project.id}?list=${list.id}`)
                                  }
                                  className="w-full text-left py-1 px-2 rounded text-xs text-gray-700 hover:bg-gray-50 truncate"
                                >
                                  {list.name}
                                </button>
                              </li>
                            ))}
                            {lists.length === 0 && (
                              <li className="py-1 px-2 text-[11px] text-gray-400">No lists yet</li>
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
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-gray-500"
                  >
                    + New Space
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-[13px] font-semibold text-gray-600 mb-2">Channels</p>
            <button className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-gray-700">
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

        {secondaryRailOpen && (
          <div className="px-4 py-3 border-t border-gray-200 shrink-0 mt-auto">
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              loading={notificationsLoading}
              isOpen={isOpen}
              toggleDropdown={toggleDropdown}
              markOneAsRead={markOneAsRead}
              markAllAsRead={markAllAsRead}
              deleteNotification={deleteNotification}
            />
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto min-w-0" style={{ background: '#f8f7ff' }}>
        <Outlet />
      </main>
      </div>
      {toast && <NotificationToast notification={toast} onClose={hideToast} />}
      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={refetch}
        canInvite={currentUserRole === 'owner' || currentUserRole === 'admin'}
      />
      <CreateSpaceModal
        isOpen={createSpaceModalOpen}
        onClose={() => setCreateSpaceModalOpen(false)}
        onCreated={handleSpaceCreated}
      />
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
