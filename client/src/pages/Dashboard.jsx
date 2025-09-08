import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import EditGoal from '../components/goals/EditGoal';
import { TextField, Switch, FormControlLabel } from '@mui/material';


const Dashboard = () => {
  const [goals, setGoals] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: true,
    goal_type: 'personal',
    start_date: '',
    end_date: ''
  });
  const [isChallenge, setIsChallenge] = useState(false);
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

  const { title, description, is_public, start_date, end_date } = formData;

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleChallengeSwitch = (e) => {
    setIsChallenge(e.target.checked);
    setFormData({
      ...formData,
      goal_type: e.target.checked ? 'challenge' : 'personal',
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/goals', formData);
      setGoals([res.data, ...goals]);
      // Reset form
      setFormData({ title: '', description: '', is_public: true, goal_type: 'personal', start_date: '', end_date: '' });
      setIsChallenge(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Failed to create goal.');
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
            <TextField
              label="Goal Title"
              name="title"
              value={title}
              onChange={onChange}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Goal Description"
              name="description"
              value={description}
              onChange={onChange}
              fullWidth
              multiline
              rows={3}
              margin="normal"
            />
            <FormControlLabel
              control={<Switch checked={is_public} onChange={onChange} name="is_public" />}
              label="Public Goal"
            />
            <FormControlLabel
              control={<Switch checked={isChallenge} onChange={handleChallengeSwitch} name="isChallenge" />}
              label="Make it a Challenge"
            />
            {isChallenge && (
              <>
                <TextField
                  label="Start Date"
                  type="date"
                  name="start_date"
                  value={start_date}
                  onChange={onChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mr: 2 }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  name="end_date"
                  value={end_date}
                  onChange={onChange}
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}
            <Button type="submit" variant="contained" sx={{ display: 'block', mt: 2 }}>Create Goal</Button>
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
