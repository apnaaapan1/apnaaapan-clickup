import { useNavigate } from 'react-router-dom';
import useProjects from '../hooks/useProjects';

export default function Projects() {
  const navigate = useNavigate();
  const { projects, loading, error, refetch } = useProjects();

  return (
    <div className="p-6">
      <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Spaces</h1>
            <p className="text-sm text-gray-500">Total spaces: {projects.length}</p>
          </div>
          <button
            onClick={() => {
              window.dispatchEvent(new Event('projects:changed'));
              refetch();
            }}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm"
          >
            + New Space
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading spaces...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="text-left p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: project.color || '#6366f1' }}
              />
              <h2 className="font-semibold text-gray-800 truncate">{project.name}</h2>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2">
              {project.description || 'No description'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
