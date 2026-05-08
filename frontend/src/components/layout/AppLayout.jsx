import { useEffect, useMemo, useRef, useState } from 'react';
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

const linkBase =
  'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white transition-colors';

function IconHome() {
  return <span>🏠</span>;
}
function IconFolder() {
  return <span>📁</span>;
}
function IconUsers() {
  return <span>👥</span>;
}
function IconLogout() {
  return <span>↪</span>;
}

export default function AppLayout() {
  const { user, workspaceId, logout } = useAuth();
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
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingError, setCreatingError] = useState('');
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('member');
  const workspaceMenuRef = useRef(null);

  useEffect(() => {
    const loadWorkspace = async () => {
      if (!workspaceId) return;
      try {
        const res = await api.get(`/workspaces/${workspaceId}`);
        if (res.data?.workspace?.name) {
          setWorkspaceName(res.data.workspace.name);
        }
        const myMembership = (res.data?.workspace?.members || []).find(
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

  const createProject = async () => {
    const name = newProjectName.trim();
    if (!name) {
      setCreatingError('Space name is required');
      return;
    }
    if (!workspaceId) {
      setCreatingError('Workspace not loaded. Please re-login once.');
      return;
    }
    setCreatingError('');
    setCreatingLoading(true);
    try {
      await api.post(`/workspaces/${workspaceId}/projects`, {
        name,
        description: '',
        color: '#6366f1',
      });
      setNewProjectName('');
      setCreating(false);
      await refetch();
      window.dispatchEvent(new Event('projects:changed'));
    } catch (err) {
      setCreatingError(err.response?.data?.message || 'Failed to create space');
    } finally {
      setCreatingLoading(false);
    }
  };

  const handleCreateProjectKeyDown = async (e) => {
    if (e.key === 'Escape') {
      setCreating(false);
      setNewProjectName('');
      setCreatingError('');
      return;
    }
    if (e.key !== 'Enter') return;
    e.preventDefault();
    await createProject();
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#f7f7fa]">
      <aside className="w-[72px] h-full flex flex-col items-center py-4 gap-4 bg-gradient-to-b from-indigo-700 to-indigo-900 text-white">
        <button className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-lg">🏠</button>
        <button className="w-11 h-11 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg">🗓</button>
        <button className="w-11 h-11 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg">✨</button>
        <button className="w-11 h-11 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg">👥</button>
        <button className="w-11 h-11 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg">⋯</button>
        <div className="flex-1" />
        <button
          onClick={openInviteModal}
          className="w-11 h-11 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg"
          title="Invite"
        >
          ➕
        </button>
      </aside>

      <aside className="w-[330px] h-full bg-white border-r border-gray-200 flex flex-col relative">
        <div className="px-4 py-3 border-b border-gray-200" ref={workspaceMenuRef}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWorkspaceMenuOpen((prev) => !prev)}
              className="flex-1 h-9 rounded-lg border border-gray-200 px-2.5 flex items-center gap-2 hover:bg-gray-50"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                {workspaceInitial}
              </div>
              <span className="text-[14px] font-semibold text-gray-800 truncate">{workspaceName}</span>
              <span className="text-xs text-gray-500 ml-auto">▾</span>
            </button>
            <button className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">📅</button>
          </div>

          {workspaceMenuOpen && (
            <div className="absolute left-3 right-3 top-[56px] z-40 bg-white rounded-xl border border-gray-200 shadow-lg p-3">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-base font-semibold">
                  {workspaceInitial}
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-gray-800">{workspaceName}</p>
                  <p className="text-[12px] text-gray-500">10 members • Free Forever</p>
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

        <div className="px-4 py-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-[32px] leading-none font-semibold text-gray-900">Home</h2>
            <button className="h-10 px-4 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700">
              + Create
            </button>
          </div>

          <div className="mt-5 space-y-2 text-gray-700">
            <NavLink to="/" end className={({ isActive }) => `block px-2 py-1.5 rounded ${isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}>Inbox</NavLink>
            <button className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50">Replies <span className="text-xs text-gray-400 ml-2">Coming soon</span></button>
            <button className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50">My Tasks <span className="text-xs text-gray-400 ml-2">Coming soon</span></button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-[13px] font-semibold text-gray-600 mb-2">Spaces</p>
            <NavLink to="/projects" className={({ isActive }) => `block px-2 py-1.5 rounded ${isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}>
              All Spaces
            </NavLink>
            <NavLink to="/workspace" className={({ isActive }) => `block px-2 py-1.5 rounded ${isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}>
              Workspace Settings
            </NavLink>
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 flex items-center gap-2"
              >
                <span className="w-5 h-5 rounded bg-emerald-500 text-white text-[11px] flex items-center justify-center">
                  {(project.name || 'P').trim().charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{project.name}</span>
              </button>
            ))}

            <div className="mt-2">
              {creating ? (
                <>
                  <input
                    autoFocus
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={handleCreateProjectKeyDown}
                    placeholder="New space name..."
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 outline-none"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={createProject}
                      disabled={creatingLoading}
                      className="px-2.5 py-1.5 rounded bg-violet-600 text-white text-xs hover:bg-violet-700 disabled:opacity-60"
                    >
                      {creatingLoading ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      onClick={() => {
                        setCreating(false);
                        setNewProjectName('');
                        setCreatingError('');
                      }}
                      className="px-2.5 py-1.5 rounded border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                  {creatingError && <p className="text-xs mt-1 text-red-500">{creatingError}</p>}
                </>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-gray-500"
                >
                  + New Space
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-[13px] font-semibold text-gray-600 mb-2">Channels</p>
            <button className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-gray-700">
              + Add Channel <span className="text-xs text-gray-400 ml-2">Coming soon</span>
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200">
          <div className="mb-2">
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
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-semibold">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-800 text-sm truncate">{user?.name || 'User'}</p>
              <p className="text-xs truncate text-gray-500">{user?.email || '-'}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600 flex items-center justify-center"
            >
              <IconLogout />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto" style={{ background: '#f8f7ff' }}>
        <Outlet />
      </main>
      {toast && <NotificationToast notification={toast} onClose={hideToast} />}
      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={refetch}
        canInvite={currentUserRole === 'owner' || currentUserRole === 'admin'}
      />
    </div>
  );
}
