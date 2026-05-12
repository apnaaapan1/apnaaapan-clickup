import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import api from '../../api/axios';
import useTasks from '../../hooks/useTasks';
import KanbanCard from './KanbanCard';
import AddTaskInput from './AddTaskInput';
import ListBulletIcon from '../icons/ListBulletIcon';

const statusAccent = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  in_review: '#f59e0b',
  done: '#22c55e',
  cancelled: '#ef4444',
};

export default function KanbanColumn({ list, workspaceId, projectId, onRefetch, onOpenTask }) {
  const { tasks, loading } = useTasks(list.id);
  const [showInput, setShowInput] = useState(false);
  const { setNodeRef } = useDroppable({
    id: list.id,
    data: { type: 'column', listId: list.id },
  });

  const handleCreateTask = async (title) => {
    await api.post(
      `/workspaces/${workspaceId}/projects/${projectId}/lists/${list.id}/tasks`,
      {
        title,
        priority: 'medium',
      }
    );
    setShowInput(false);
    onRefetch();
  };

  return (
    <div className="w-[280px] shrink-0 bg-white rounded-xl shadow-sm flex flex-col max-h-[calc(100vh-120px)]">
      <div
        className="px-3 py-3 border-b border-gray-100 flex items-center justify-between"
        style={{ borderLeft: `3px solid ${statusAccent[list.status || 'todo'] || '#94a3b8'}` }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <ListBulletIcon className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          <h3 className="text-[14px] font-semibold text-gray-800 truncate min-w-0 flex-1">
            {list.name}
          </h3>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
            {tasks.length}
          </span>
        </div>
        <button className="text-gray-400 text-sm">⋯</button>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onOpenTask={onOpenTask} />
          ))}
        </SortableContext>
        {!loading && tasks.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">No tasks yet</p>
        )}
      </div>

      <div className="p-2 border-t border-gray-100">
        {showInput ? (
          <AddTaskInput
            onSubmit={handleCreateTask}
            onCancel={() => setShowInput(false)}
          />
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="w-full text-left px-2 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50"
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  );
}
