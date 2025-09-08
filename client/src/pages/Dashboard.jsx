import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import EditGoal from '../components/goals/EditGoal';

const Dashboard = () => {
  const [goals, setGoals] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [editingGoal, setEditingGoal] = useState(null);

  useEffect(() => {
    const getGoals = async () => {
      try {
        const res = await api.get('/goals');
        setGoals(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load goals.');
      }
    };
    getGoals();
  }, []);

  const { title, description } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/goals', formData);
      setGoals([res.data, ...goals]);
      setFormData({ title: '', description: '' });
    } catch (err) {
      console.error(err);
      setError('Failed to create goal.');
    }
  };

  const deleteGoal = async (id) => {
    try {
      await api.delete(`/goals/${id}`);
      setGoals(goals.filter((goal) => goal.goal_id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete goal.');
    }
  };

  const handleUpdateGoal = (updatedGoal) => {
    setGoals(
      goals.map((goal) =>
        goal.goal_id === updatedGoal.goal_id ? updatedGoal : goal
      )
    );
    setEditingGoal(null); // Close the modal/form
  };

  return (
    <div>
      <Link to="/create-article" style={{ float: 'right', padding: '10px', backgroundColor: 'blue', color: 'white', textDecoration: 'none' }}>
        + New Article
      </Link>
      <h2>Dashboard</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {editingGoal ? (
        <EditGoal
          goal={editingGoal}
          onUpdate={handleUpdateGoal}
          onCancel={() => setEditingGoal(null)}
        />
      ) : (
        <>
          <h3>Create a New Goal</h3>
          <form onSubmit={onSubmit}>
            <input
              type="text"
              name="title"
              value={title}
              onChange={onChange}
              placeholder="Goal Title"
              required
            />
            <textarea
              name="description"
              value={description}
              onChange={onChange}
              placeholder="Goal Description"
            />
            <button type="submit">Create Goal</button>
          </form>
        </>
      )}

      <hr />

      <h3>Your Goals</h3>
      <div>
        {goals.length > 0 ? (
          goals.map((goal) => (
            <div key={goal.goal_id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
              <h4>
                <Link to={`/goal/${goal.goal_id}`}>{goal.title}</Link>
              </h4>
              <p>{goal.description}</p>
              <small>Public: {goal.is_public ? 'Yes' : 'No'}</small>
              <button onClick={() => setEditingGoal(goal)}>Edit</button>
              <button onClick={() => deleteGoal(goal.goal_id)}>Delete</button>
            </div>
          ))
        ) : (
          <p>You have not set any goals yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
