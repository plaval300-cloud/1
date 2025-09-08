import React from 'react';
import { useParams, Link } from 'react-router-dom';
import KanbanBoard from '../components/kanban/KanbanBoard';

const KanbanPage = () => {
  const { goalId } = useParams();

  return (
    <div>
      <Link to={`/goal/${goalId}`}>Back to Goal Details</Link>
      <h2>Kanban Board</h2>
      <KanbanBoard goalId={goalId} />
    </div>
  );
};

export default KanbanPage;
