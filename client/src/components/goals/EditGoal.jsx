import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const EditGoal = ({ goal, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: true,
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description || '',
        is_public: goal.is_public,
      });
    }
  }, [goal]);

  const { title, description, is_public } = formData;

  const onChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/goals/${goal.goal_id}`, formData);
      onUpdate(res.data); // Pass the updated goal back to the parent
    } catch (err) {
      console.error(err);
      // Handle error display in the component
    }
  };

  if (!goal) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Edit Goal</h3>
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
          <div>
            <label>
              <input
                type="checkbox"
                name="is_public"
                checked={is_public}
                onChange={onChange}
              />
              Public
            </label>
          </div>
          <button type="submit">Update Goal</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default EditGoal;
