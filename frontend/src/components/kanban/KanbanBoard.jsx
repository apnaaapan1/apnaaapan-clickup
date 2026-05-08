import { useMemo, useState } from 'react';
import { DragOverlay, DndContext } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

export default function KanbanBoard({ project, lists, onRefetch, onOpenTask }) {
  const { workspaceId } = useAuth();
  const [addingList, setAddingList] = useState(false);
  const [listName, setListName] = useState('');
  const [activeTask, setActiveTask] = useState(null);

  const listIds = useMemo(() => lists.map((l) => l.id), [lists]);

  const handleAddListKeyDown = async (e) => {
    if (e.key === 'Escape') {
      setAddingList(false);
      setListName('');
      return;
    }
    if (e.key !== 'Enter') return;
    const name = listName.trim();
    if (!name || !workspaceId || !project?.id) return;

    await api.post(`/workspaces/${workspaceId}/projects/${project.id}/lists`, { name });
    setAddingList(false);
    setListName('');
    onRefetch();
  };

  const handleDragStart = (event) => {
    const task = event.active?.data?.current?.task;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !active?.id) return;

    const activeData = active.data?.current;
    const overData = over.data?.current;
    const sourceListId = activeData?.listId;
    const targetListId =
      overData?.type === 'task' ? overData.listId : overData?.type === 'column' ? over.id : null;

    if (!sourceListId || !targetListId) return;

    if (String(sourceListId) !== String(targetListId)) {
      await api.patch(
        `/workspaces/${workspaceId}/projects/${project.id}/lists/${sourceListId}/tasks/${active.id}/move`,
        { newListId: targetListId, position: 0 }
      );
      onRefetch();
      return;
    }

    if (overData?.type === 'task' && active.id !== over.id) {
      const activePos = activeData?.task?.position ?? 0;
      const overPos = overData?.task?.position ?? 0;
      const ordered = arrayMove(
        [
          { id: active.id, position: activePos },
          { id: over.id, position: overPos },
        ],
        0,
        1
      ).map((item, idx) => ({ id: item.id, position: idx }));

      await api.patch(
        `/workspaces/${workspaceId}/projects/${project.id}/lists/${sourceListId}/tasks/reorder`,
        { tasks: ordered }
      );
      onRefetch();
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto h-full p-6">
        {lists.map((list) => (
          <KanbanColumn
            key={list.id}
            list={list}
            workspaceId={workspaceId}
            projectId={project.id}
            onRefetch={onRefetch}
            onOpenTask={onOpenTask}
          />
        ))}

        <div className="w-[280px] shrink-0">
          {addingList ? (
            <input
              autoFocus
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              onKeyDown={handleAddListKeyDown}
              onBlur={() => setAddingList(false)}
              placeholder="List name..."
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
          ) : (
            <button
              onClick={() => setAddingList(true)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              + Add List
            </button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
