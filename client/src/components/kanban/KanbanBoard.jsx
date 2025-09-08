import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import api from '../../utils/api';

const KanbanBoard = ({ goalId }) => {
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState({
    'To Do': [],
    'In Progress': [],
    'Done': [],
  });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get(`/goals/${goalId}/tasks`);
        setTasks(res.data);
      } catch (err) {
        console.error('Failed to fetch tasks', err);
      }
    };
    fetchTasks();
  }, [goalId]);

  useEffect(() => {
    // When tasks change, regroup them into columns
    const newColumns = { 'To Do': [], 'In Progress': [], 'Done': [] };
    tasks.forEach(task => {
      if (newColumns[task.status]) {
        newColumns[task.status].push(task);
      } else {
        // Fallback for any tasks with an unexpected status
        newColumns['To Do'].push(task);
      }
    });
    setColumns(newColumns);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeTask = tasks.find(t => t.task_id === active.id);
    const overColumnId = over.id;

    // Check if the task was dropped over a valid column and its status is different
    if (columns[overColumnId] && activeTask.status !== overColumnId) {
      // Optimistically update the UI
      const updatedTasks = tasks.map(t =>
        t.task_id === active.id ? { ...t, status: overColumnId } : t
      );
      setTasks(updatedTasks);

      // Persist the change to the backend
      api.put(`/tasks/${active.id}`, { status: overColumnId })
        .catch(err => {
          console.error("Failed to update task status", err);
          // Revert the optimistic update on failure
          setTasks(tasks);
        });
    }
  };

  const boardStyle = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: '20px',
    backgroundColor: '#e0e0e0'
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div style={boardStyle}>
        {Object.keys(columns).map(columnId => (
          <KanbanColumn
            key={columnId}
            id={columnId}
            title={columnId}
            tasks={columns[columnId]}
          />
        ))}
      </div>
    </DndContext>
  );
};

export default KanbanBoard;
