import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Column } from '../types';
import { useBoardStore } from '../store/boardStore';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';

export default function KanbanColumn({ column, visibleTasks = column.tasks, filtered = false }: { column: Column; visibleTasks?: Column['tasks']; filtered?: boolean }) {
  const { deleteColumn, renameColumn } = useBoardStore();
  const [addingTask, setAddingTask] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(column.name);

  const { setNodeRef, isOver } = useDroppable({ id: `col-${column.id}`, data: { type: 'column', columnId: column.id } });

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) await renameColumn(column.id, newName.trim());
    setRenaming(false);
  };

  const taskIds = visibleTasks.map((t) => `task-${t.id}`);
  const statusClass = /done|complete|finished/i.test(column.name)
    ? 'complete'
    : /progress|doing|active/i.test(column.name) ? 'progress' : 'todo';

  return (
    <div className={`kanban-column wrike-kanban-column status-${statusClass} ${isOver ? 'column-over' : ''}`}>
      <div className="column-header">
        {renaming ? (
          <form onSubmit={handleRename} className="rename-form">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus onBlur={handleRename} />
          </form>
        ) : (
          <h3 onDoubleClick={() => setRenaming(true)}><i className="wrike-status-dot" />{column.name}</h3>
        )}
        <span className="task-count">{filtered ? `${visibleTasks.length}/${column.tasks.length}` : column.tasks.length}</span>
        <div className="col-actions">
          <button onClick={() => setRenaming(true)} title="Rename">···</button>
          <button onClick={() => deleteColumn(column.id)} title="Delete column">×</button>
        </div>
      </div>

      <div ref={setNodeRef} className="column-tasks">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {visibleTasks.map((task) => <TaskCard key={task.id} task={task} />)}
          {filtered && visibleTasks.length === 0 && <div className="wrike-column-no-results">No matching tasks</div>}
        </SortableContext>
      </div>

      <button className="add-task-btn" onClick={() => setAddingTask(true)}>
        <span>+</span> Add task
      </button>
      {addingTask && <TaskModal columnId={column.id} onClose={() => setAddingTask(false)} />}
    </div>
  );
}
