import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import useLists from '../hooks/useLists';
import KanbanBoard from '../components/kanban/KanbanBoard';
import ListView from '../components/listview/ListView';
import TaskModal from '../components/task/TaskModal';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const { project, lists, loading, error, refetch } = useLists(projectId);
  const [view, setView] = useState('board');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedListId, setSelectedListId] = useState(null);
  const selectedListFromQueryId = searchParams.get('list');
  const selectedList = useMemo(
    () => lists.find((list) => String(list.id) === String(selectedListFromQueryId)),
    [lists, selectedListFromQueryId]
  );
  const visibleLists = useMemo(
    () => (selectedList ? [selectedList] : lists),
    [lists, selectedList]
  );

  const onOpenTask = (task) => {
    setSelectedTaskId(task.id);
    setSelectedListId(task.list_id);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: project?.color || '#6366f1' }}
            />
            <h1 className="text-2xl font-bold text-gray-800">
              {project?.name || 'Space'}
              {selectedList ? (
                <span className="text-xl font-medium text-gray-500"> / {selectedList.name}</span>
              ) : null}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('board')}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                view === 'board'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                view === 'list'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 text-sm text-red-600">{error}</div>
      ) : (
        <>
          {view === 'board' ? (
            <KanbanBoard
              project={project}
              lists={visibleLists}
              onRefetch={refetch}
              onOpenTask={onOpenTask}
            />
          ) : (
            <ListView
              project={project}
              lists={visibleLists}
              onRefetch={refetch}
              onOpenTask={onOpenTask}
            />
          )}

          {selectedTaskId && (
            <TaskModal
              taskId={selectedTaskId}
              listId={selectedListId}
              projectId={projectId}
              onClose={() => setSelectedTaskId(null)}
              onRefetch={refetch}
            />
          )}
        </>
      )}
    </div>
  );
}
