import { useEffect, useMemo, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import KanbanCard from './KanbanCard';
import AddTaskInput from './AddTaskInput';

function DroppableStatusColumn({ columnKey, children }) {
  const { setNodeRef } = useDroppable({
    id: `column-${columnKey}`,
    data: { type: 'column', columnKey },
  });
  return (
    <div ref={setNodeRef} className="px-2 pb-2 overflow-y-auto flex-1">
      {children}
    </div>
  );
}

export default function KanbanBoard({ project, lists, onRefetch, onOpenTask }) {
  const { workspaceId } = useAuth();
  const [tasksByList, setTasksByList] = useState({});
  const [addingStatus, setAddingStatus] = useState(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const fetchAllTasks = async () => {
    if (!workspaceId || !project?.id || lists.length === 0) {
      setTasksByList({});
      return;
    }
    const entries = await Promise.all(
      lists.map(async (list) => {
        try {
          const res = await api.get(
            `/workspaces/${workspaceId}/projects/${project.id}/lists/${list.id}/tasks`
          );
          return [list.id, res.data?.tasks || []];
        } catch {
          return [list.id, []];
        }
      })
    );
    setTasksByList(Object.fromEntries(entries));
  };

  useEffect(() => {
    fetchAllTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, project?.id, lists.map((l) => l.id).join(',')]);

  useEffect(() => {
    const onTasksChanged = () => fetchAllTasks();
    window.addEventListener('tasks:changed', onTasksChanged);
    return () => window.removeEventListener('tasks:changed', onTasksChanged);
  }, []);

  const allTasks = useMemo(
    () => Object.values(tasksByList).flat(),
    [tasksByList]
  );

  const columns = useMemo(() => {
    const todo = [];
    const inProgress = [];
    const complete = [];

    allTasks.forEach((task) => {
      const status = task.status || 'todo';
      if (status === 'done' || status === 'cancelled') {
        complete.push(task);
      } else if (status === 'in_progress' || status === 'in_review') {
        inProgress.push(task);
      } else {
        todo.push(task);
      }
    });

    return [
      {
        key: 'todo',
        label: 'TO DO',
        addStatus: 'todo',
        badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
        panelClass: 'bg-gray-50',
        tasks: todo,
      },
      {
        key: 'in_progress',
        label: 'IN PROGRESS',
        addStatus: 'in_progress',
        badgeClass: 'bg-violet-100 text-violet-700 border-violet-200',
        panelClass: 'bg-violet-50/50',
        tasks: inProgress,
      },
      {
        key: 'complete',
        label: 'COMPLETE',
        addStatus: 'done',
        badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        panelClass: 'bg-emerald-50/50',
        tasks: complete,
      },
    ];
  }, [allTasks]);

  const handleCreateTask = async (columnStatus, payload) => {
    const targetListId = lists[0]?.id;
    if (!targetListId || creatingTask) return;
    setCreatingTask(true);
    try {
      const basePayload =
        typeof payload === 'string'
          ? { title: payload }
          : payload || {};

      const res = await api.post(`/workspaces/${workspaceId}/projects/${project.id}/lists/${targetListId}/tasks`, {
        priority: 'medium',
        status: columnStatus,
        ...basePayload,
      });

      const newTask = res.data?.task;
      if (newTask) {
        setTasksByList((prev) => ({
          ...prev,
          [targetListId]: [...(prev[targetListId] || []), newTask],
        }));
      }

      setAddingStatus(null);
      fetchAllTasks();
    } finally {
      setCreatingTask(false);
    }
  };

  const statusToColumnKey = (status) => {
    if (status === 'done' || status === 'cancelled') return 'complete';
    if (status === 'in_progress' || status === 'in_review') return 'in_progress';
    return 'todo';
  };

  const columnKeyToStatus = {
    todo: 'todo',
    in_progress: 'in_progress',
    complete: 'done',
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!active?.id || !over) {
      setActiveTask(null);
      return;
    }

    const draggedTask = active?.data?.current?.task;
    if (!draggedTask) {
      setActiveTask(null);
      return;
    }

    const fromColumnKey = active?.data?.current?.columnKey || statusToColumnKey(draggedTask.status);
    const overType = over?.data?.current?.type;
    const toColumnKey =
      overType === 'column'
        ? over?.data?.current?.columnKey
        : overType === 'task'
        ? over?.data?.current?.columnKey
        : null;

    if (!toColumnKey || toColumnKey === fromColumnKey) {
      setActiveTask(null);
      return;
    }

    const nextStatus = columnKeyToStatus[toColumnKey];
    if (!nextStatus || nextStatus === draggedTask.status) {
      setActiveTask(null);
      return;
    }

    setTasksByList((prev) => {
      const updated = {};
      for (const [listId, tasks] of Object.entries(prev)) {
        updated[listId] = tasks.map((t) =>
          t.id === draggedTask.id ? { ...t, status: nextStatus } : t
        );
      }
      return updated;
    });
    setActiveTask(null);

    api.patch(
      `/workspaces/${workspaceId}/projects/${project.id}/lists/${draggedTask.list_id}/tasks/${draggedTask.id}`,
      { status: nextStatus }
    ).then(() => fetchAllTasks());
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => setActiveTask(event?.active?.data?.current?.task || null)}
      onDragCancel={() => setActiveTask(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto h-full p-6 items-start">
        {lists.length === 0 ? (
          <p className="text-sm text-gray-500 px-2">
            No lists yet — use the sidebar on a space (hover the +) to create a list.
          </p>
        ) : (
          columns.map((column) => (
            <div
              key={column.key}
              className={`w-[320px] shrink-0 rounded-2xl border border-gray-200 ${column.panelClass} flex flex-col max-h-[calc(100vh-155px)]`}
            >
              <div className="px-3 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full border text-[13px] font-bold tracking-wide ${column.badgeClass}`}
                  >
                    {column.label}
                  </span>
                  <span className="text-lg font-semibold text-gray-500">{column.tasks.length}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <button type="button" className="w-6 h-6 rounded hover:bg-white/70">
                    ⋯
                  </button>
                  <button
                    type="button"
                    className="w-6 h-6 rounded hover:bg-white/70 text-lg leading-none"
                    onClick={() => setAddingStatus(column.key)}
                  >
                    +
                  </button>
                </div>
              </div>

              <DroppableStatusColumn columnKey={column.key}>
                <SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                  {column.tasks.map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      columnKey={column.key}
                      onOpenTask={onOpenTask}
                    />
                  ))}
                </SortableContext>
              </DroppableStatusColumn>

              <div className="px-3 py-2 border-t border-gray-100">
                {addingStatus === column.key ? (
                  <AddTaskInput
                    onSubmit={(taskPayload) => handleCreateTask(column.addStatus, taskPayload)}
                    onCancel={() => setAddingStatus(null)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingStatus(column.key)}
                    className="w-full text-left px-2 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-white/70"
                  >
                    + Add Task
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <DragOverlay>
        {activeTask ? (
          <KanbanCard
            task={activeTask}
            columnKey="overlay"
            onOpenTask={null}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
