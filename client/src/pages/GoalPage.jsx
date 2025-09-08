import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const GoalPage = () => {
  const { goalId } = useParams();
  const { user } = useContext(AuthContext);

  const [goal, setGoal] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const goalRes = await api.get(`/goals/${goalId}`);
        const tasksRes = await api.get(`/goals/${goalId}/tasks`);
        setGoal(goalRes.data);
        setTasks(tasksRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load goal data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [goalId]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    try {
      const res = await api.post(`/goals/${goalId}/tasks`, { description: taskText });
      setTasks([...tasks, res.data]);
      setTaskText('');
    } catch (err) {
      console.error(err);
      setError('Failed to add task.');
    }
  };

  const handleToggleTask = async (task) => {
    try {
      const updatedTask = { ...task, is_completed: !task.is_completed };
      const res = await api.put(`/tasks/${task.task_id}`, updatedTask);
      setTasks(tasks.map((t) => (t.task_id === task.task_id ? res.data : t)));
    } catch (err) {
      console.error(err);
      setError('Failed to update task.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
        await api.delete(`/tasks/${taskId}`);
        setTasks(tasks.filter(t => t.task_id !== taskId));
    } catch (err) {
        console.error(err);
        setError('Failed to delete task.');
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!goal) return <p>Goal not found.</p>;

  return (
    <div>
      <Link to="/dashboard">Back to Dashboard</Link>
      <br />
      <Link to={`/goal/${goalId}/kanban`}>View on Kanban Board</Link>
      {' | '}
      <Link to={`/goal/${goalId}/notes`}>View Notes</Link>
      <h2>{goal.title}</h2>
      <p>{goal.description}</p>

      <hr />

      <h3>Tasks</h3>
      <form onSubmit={handleAddTask}>
        <input
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          placeholder="Add a new task"
        />
        <button type="submit">Add Task</button>
      </form>

      <ul>
        {tasks.map((task) => (
          <li key={task.task_id} style={{ textDecoration: task.is_completed ? 'line-through' : 'none' }}>
            <input
              type="checkbox"
              checked={task.is_completed}
              onChange={() => handleToggleTask(task)}
            />
            {task.description}
            <button onClick={() => handleDeleteTask(task.task_id)} style={{marginLeft: '10px'}}>X</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GoalPage;
