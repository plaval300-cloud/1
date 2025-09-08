const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// @route   POST api/goals
// @desc    Create a goal
// @access  Private
router.post('/', auth, async (req, res) => {
  const { title, description, is_public } = req.body;
  const user_id = req.user.id;

  if (!title) {
    return res.status(400).json({ msg: 'Please provide a title for the goal.' });
  }

  try {
    const newGoal = await db.query(
      'INSERT INTO goals (user_id, title, description, is_public) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, title, description, is_public]
    );
    res.json(newGoal.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/goals/:id
// @desc    Get a single goal by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await db.query('SELECT * FROM goals WHERE goal_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (goal.rows.length === 0) {
      return res.status(404).json({ msg: 'Goal not found.' });
    }
    res.json(goal.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/goals
// @desc    Get all goals for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const goals = await db.query('SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(goals.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/goals/:id
// @desc    Update a goal
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { title, description, is_public } = req.body;
    const goal_id = req.params.id;

    try {
        const goal = await db.query('SELECT * FROM goals WHERE goal_id = $1 AND user_id = $2', [goal_id, req.user.id]);
        if (goal.rows.length === 0) {
            return res.status(404).json({ msg: 'Goal not found or user not authorized.' });
        }

        const updatedGoal = await db.query(
            'UPDATE goals SET title = $1, description = $2, is_public = $3 WHERE goal_id = $4 RETURNING *',
            [title, description, is_public, goal_id]
        );

        res.json(updatedGoal.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   DELETE api/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    const goal_id = req.params.id;

    try {
        const goal = await db.query('SELECT * FROM goals WHERE goal_id = $1 AND user_id = $2', [goal_id, req.user.id]);
        if (goal.rows.length === 0) {
            return res.status(404).json({ msg: 'Goal not found or user not authorized.' });
        }

        await db.query('DELETE FROM goals WHERE goal_id = $1', [goal_id]);

        res.json({ msg: 'Goal removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
