import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import useLists from '../hooks/useLists';
import KanbanBoard from '../components/kanban/KanbanBoard';
import ListView from '../components/listview/ListView';
import TaskModal from '../components/task/TaskModal';
import NotificationBell from '../components/notifications/NotificationBell';
import ListBulletIcon from '../components/icons/ListBulletIcon';

export default function ProjectDetail() {
  const { notificationBellProps } = useOutletContext() || {};
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { project, lists, loading, error, refetch } = useLists(projectId);
  const [view, setView] = useState('list');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedListId, setSelectedListId] = useState(null);
  const selectedListFromQueryId = searchParams.get('list');

  const openTaskParam = searchParams.get('openTask');
  const openTaskListParam = searchParams.get('openTaskList');
  const consumedOpenTask = useRef(null);

  useEffect(() => {
    if (openTaskParam && openTaskListParam && consumedOpenTask.current !== openTaskParam) {
      consumedOpenTask.current = openTaskParam;
      setSelectedTaskId(openTaskParam);
      setSelectedListId(openTaskListParam);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('openTask');
        next.delete('openTaskList');
        return next;
      }, { replace: true });
    }
  }, [openTaskParam, openTaskListParam, setSearchParams]);
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
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: project?.color || '#6366f1' }}
            />
            <h1 className="text-[26px] font-bold text-gray-900 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate min-w-0 max-w-[100%] sm:max-w-[min(100%,24rem)]">
                {project?.name || 'Space'}
              </span>
              {selectedList ? (
                <span className="text-[22px] font-semibold text-gray-500 inline-flex items-center gap-2 min-w-0 max-w-full">
                  <span className="shrink-0" aria-hidden>
                    /
                  </span>
                  <ListBulletIcon className="w-5 h-5 shrink-0 text-gray-400" />
                  <span className="truncate min-w-0">{selectedList.name}</span>
                </span>
              ) : null}
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
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
              type="button"
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                view === 'list'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              List
            </button>
            {notificationBellProps ? (
              <NotificationBell {...notificationBellProps} placement="header" />
            ) : null}
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
