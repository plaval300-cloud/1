import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Box, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText, TextField, Button, Chip } from '@mui/material';


const GoalPage = () => {
  const { goalId } = useParams();
  const { user } = useContext(AuthContext);

  const [goal, setGoal] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [taskText, setTaskText] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userMembership = members.find(m => m.user_id === user?.user_id);
  const isOwner = userMembership?.role === 'owner';
  const isParticipant = userMembership?.role === 'participant';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const goalRes = await api.get(`/goals/${goalId}`);
        const tasksRes = await api.get(`/goals/${goalId}/tasks`);
        const membersRes = await api.get(`/goals/${goalId}/members`);
        setGoal(goalRes.data);
        setTasks(tasksRes.data);
        setMembers(membersRes.data);
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

  const handleJoinChallenge = async () => {
    try {
      await api.post(`/goals/${goalId}/join`);
      // Refresh data to show new member status
      fetchData();
    } catch (err) {
      console.error('Failed to join challenge', err);
      setError(err.response?.data?.msg || 'Could not join challenge.');
    }
  };

  const handleLeaveChallenge = async () => {
    try {
      await api.delete(`/goals/${goalId}/leave`);
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Failed to leave challenge', err);
      setError(err.response?.data?.msg || 'Could not leave challenge.');
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

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await api.post('/invitations', { goalId, inviteeUsername });
      setInviteUsername('');
      // Optionally, refresh members list or show a success message
    } catch (err) {
      console.error('Failed to send invitation', err);
      // Show an error message to the user
    }
  };

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

      <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
        <h2>{goal.title}</h2>
        {goal.goal_type === 'challenge' && <Chip label="Challenge" color="secondary" sx={{ ml: 2 }} />}
      </Box>

      {goal.goal_type === 'challenge' && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">
            Challenge runs from {new Date(goal.start_date).toLocaleDateString()} to {new Date(goal.end_date).toLocaleDateString()}
          </Typography>
          {!isOwner && !isParticipant && (
            <Button variant="contained" onClick={handleJoinChallenge}>Join Challenge</Button>
          )}
          {isParticipant && (
            <Button variant="outlined" color="error" onClick={handleLeaveChallenge}>Leave Challenge</Button>
          )}
        </Box>
      )}

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

      <hr />

      <h3>{goal.goal_type === 'challenge' ? 'Participants' : 'Members'}</h3>
      <List>
        {members.map(member => (
          <ListItem key={member.user_id}>
            <ListItemAvatar>
              <Avatar src={member.avatar_url} />
            </ListItemAvatar>
            <ListItemText primary={member.username} secondary={member.role} />
          </ListItem>
        ))}
      </List>

      {isOwner && (
        <Box component="form" onSubmit={handleInvite} sx={{ mt: 2 }}>
          <Typography variant="h6">Invite User</Typography>
          <TextField
            label="Username"
            value={inviteUsername}
            onChange={(e) => setInviteUsername(e.target.value)}
            size="small"
          />
          <Button type="submit" variant="contained" sx={{ ml: 1 }}>Invite</Button>
        </Box>
      )}
    </div>
  );
};

export default GoalPage;
