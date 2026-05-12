import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useProjects from '../hooks/useProjects';
import { useAuth } from '../context/AuthContext';
import CreateSpaceModal from '../components/space/CreateSpaceModal';
import {
  getHiddenProjectIds,
  hideProjectFromSidebar,
  showProjectInSidebar,
} from '../utils/sidebarSpaceVisibility';

export default function ManageSpacesPage() {
  const navigate = useNavigate();
  const { workspaceId } = useAuth();
  const { projects, loading, error, refetch } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const [rev, setRev] = useState(0);

  const hiddenIds = useMemo(() => new Set(getHiddenProjectIds(workspaceId)), [workspaceId, rev]);

  const visibleProjects = useMemo(
    () => projects.filter((p) => !hiddenIds.has(String(p.id))),
    [projects, hiddenIds]
  );

  const hiddenProjects = useMemo(
    () => projects.filter((p) => hiddenIds.has(String(p.id))),
    [projects, hiddenIds]
  );

  const bump = () => setRev((n) => n + 1);

  const handleCreated = async () => {
    await refetch();
    window.dispatchEvent(new Event('projects:changed'));
    bump();
    setCreateOpen(false);
  };

  return (
    <div className="min-h-full flex flex-col" style={{ background: '#f8f7ff' }}>
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <span className="text-sm font-medium text-gray-500">All Spaces</span>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold"
        >
          New Space
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0 p-8">
          <h1 className="text-2xl font-bold text-gray-900">All Spaces</h1>

          <div className="mt-16 flex flex-col items-center justify-center text-center text-gray-500">
            <span className="text-5xl mb-3" aria-hidden>
              🪐
            </span>
            <p className="text-sm font-medium text-gray-600">All Spaces joined</p>
            <p className="mt-2 text-sm text-gray-500 max-w-md">
              Use the panel on the right to control which spaces appear in your sidebar. Open a space from
              the list below when you need to work in it.
            </p>
            <div className="mt-8 flex flex-wrap gap-2 justify-center">
              {projects.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="w-full max-w-sm shrink-0 border-l border-gray-200 bg-white flex flex-col">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Visible Spaces</h2>
            <p className="mt-1 text-sm text-gray-500">Spaces shown in your left sidebar.</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {loading && <p className="text-sm text-gray-500 px-2 py-2">Loading…</p>}
            {error && <p className="text-sm text-red-600 px-2 py-2">{error}</p>}
            {!loading && !error && (
              <>
                <ul className="space-y-0.5">
                  {visibleProjects.map((project) => (
                    <li key={project.id}>
                      <div className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-50 min-w-0">
                        <span className="w-9 h-9 shrink-0 rounded-lg bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center">
                          {(project.name || 'P').trim().charAt(0).toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="flex-1 min-w-0 text-left text-[15px] font-medium text-gray-900 truncate"
                        >
                          {project.name}
                        </button>
                        <button
                          type="button"
                          className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-gray-600 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-gray-200/80 hover:text-gray-900 focus-visible:opacity-100 focus-visible:pointer-events-auto transition-opacity"
                          onClick={() => {
                            hideProjectFromSidebar(workspaceId, project.id);
                            bump();
                          }}
                        >
                          Hide space
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                {visibleProjects.length === 0 && (
                  <p className="text-sm text-gray-500 px-2 py-4">No spaces visible in the sidebar.</p>
                )}

                {hiddenProjects.length > 0 ? (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <h3 className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Hidden from sidebar
                    </h3>
                    <ul className="mt-2 space-y-0.5">
                      {hiddenProjects.map((project) => (
                        <li key={project.id}>
                          <div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-50 min-w-0">
                            <span className="w-9 h-9 shrink-0 rounded-lg bg-gray-300 text-white text-sm font-semibold flex items-center justify-center">
                              {(project.name || 'P').trim().charAt(0).toUpperCase()}
                            </span>
                            <span className="flex-1 min-w-0 text-[15px] font-medium text-gray-600 truncate">
                              {project.name}
                            </span>
                            <button
                              type="button"
                              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50"
                              onClick={() => {
                                showProjectInSidebar(workspaceId, project.id);
                                bump();
                              }}
                            >
                              Show
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </aside>
      </div>

      <CreateSpaceModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
