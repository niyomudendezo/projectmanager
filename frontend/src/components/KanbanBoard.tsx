import { useState } from 'react';
import {
  DndContext, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay, closestCorners,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useBoardStore } from '../store/boardStore';
import type { Task } from '../types';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
  search?: string;
  priority?: 'all' | 'low' | 'medium' | 'high';
  status?: string | 'all';
}

export default function KanbanBoard({ search = '', priority = 'all', status = 'all' }: KanbanBoardProps) {
  const { activeProject, addColumn, moveTask } = useBoardStore();
  const [addingCol, setAddingCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  if (!activeProject) return null;
  const columns = activeProject.columns ?? [];

  const handleDragStart = ({ active }: DragStartEvent) => {
    if (active.data.current?.type === 'task') setActiveTask(active.data.current.task as Task);
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    if (!over) return;

    const taskId = active.data.current?.task?.id;
    if (!taskId) return;

    let targetColumnId: string;
    let targetPosition: number;

    if (over.data.current?.type === 'column') {
      targetColumnId = over.data.current.columnId;
      const col = columns.find((c) => c.id === targetColumnId);
      targetPosition = col?.tasks.length ?? 0;
    } else if (over.data.current?.type === 'task') {
      const overTask: Task = over.data.current.task;
      targetColumnId = overTask.column_id;
      const col = columns.find((c) => c.id === targetColumnId);
      targetPosition = col?.tasks.findIndex((t) => t.id === overTask.id) ?? 0;
    } else {
      // Fallback for nested DOM targets: resolve a target column from its id.
      const overId = String(over.id);
      if (!overId.startsWith('col-')) return;
      targetColumnId = overId.replace('col-', '');
      const col = columns.find((c) => c.id === targetColumnId);
      targetPosition = col?.tasks.length ?? 0;
    }

    const sourceTask: Task = active.data.current?.task;
    if (sourceTask.column_id === targetColumnId) {
      const col = columns.find((c) => c.id === targetColumnId);
      if (!col) return;
      const oldIdx = col.tasks.findIndex((t) => t.id === taskId);
      if (oldIdx === targetPosition) return;
    }

    await moveTask(taskId, targetColumnId, targetPosition);
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newColName.trim()) {
      await addColumn(activeProject.id, newColName.trim());
      setNewColName('');
      setAddingCol(false);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="kanban-board wrike-kanban-board">
        {columns.map((col) => {
          const query = search.trim().toLowerCase();
          const visibleTasks = col.tasks.filter((task) =>
            (!query || task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query)) &&
            (priority === 'all' || task.priority === priority) &&
            (status === 'all' || col.id === status)
          );
          return <KanbanColumn key={col.id} column={col} visibleTasks={visibleTasks} filtered={Boolean(query || priority !== 'all' || status !== 'all')} />;
        })}

        <div className="add-column">
          {addingCol ? (
            <form onSubmit={handleAddColumn} className="add-col-form">
              <input
                placeholder="Column name"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setAddingCol(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add</button>
              </div>
            </form>
          ) : (
            <button className="add-col-btn" onClick={() => setAddingCol(true)}>+ Add Column</button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="wrike-task-drag-preview">
            <span className={`wrike-priority priority-${activeTask.priority}`}>{activeTask.priority}</span>
            <b>{activeTask.title}</b>
            {activeTask.description && <p>{activeTask.description}</p>}
            <small>Move to another status</small>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
