import React from 'react';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import KanbanTask from './KanbanTask';

const KanbanColumn = ({ id, title, tasks }) => {
  const { setNodeRef } = useSortable({ id });

  const columnStyle = {
    flex: 1,
    padding: '10px',
    margin: '0 5px',
    backgroundColor: '#f4f5f7',
    borderRadius: '3px',
    minWidth: '250px',
  };

  return (
    <div ref={setNodeRef} style={columnStyle}>
      <h3>{title}</h3>
      <SortableContext items={tasks.map(t => t.task_id)}>
        {tasks.map(task => (
          <KanbanTask key={task.task_id} task={task} />
        ))}
      </SortableContext>
    </div>
  );
};

export default KanbanColumn;
