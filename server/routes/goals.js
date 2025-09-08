const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkGoalMembership } = require('../middleware/permissionMiddleware');
const db = require('../db');

// @route   POST api/goals
// @desc    Create a goal or challenge
// @access  Private
router.post('/', auth, async (req, res) => {
  const { title, description, is_public, goal_type, start_date, end_date } = req.body;
  const user_id = req.user.id;

  if (!title) {
    return res.status(400).json({ msg: 'Please provide a title for the goal.' });
  }
  if (goal_type === 'challenge' && (!start_date || !end_date)) {
    return res.status(400).json({ msg: 'Challenges require a start and end date.' });
  }

  try {
    const newGoalResult = await db.query(
      `INSERT INTO goals (user_id, title, description, is_public, goal_type, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user_id, title, description, is_public === true, goal_type || 'personal', start_date || null, end_date || null]
    );
    const newGoal = newGoalResult.rows[0];

    // Add the creator as the owner in goal_members
    await db.query(
      "INSERT INTO goal_members (goal_id, user_id, role) VALUES ($1, $2, 'owner')",
      [newGoal.goal_id, user_id]
    );

    // If the goal is public, create an event for the feed
    if (newGoal.is_public) {
      await db.query(
        "INSERT INTO events (user_id, action_type, subject_id) VALUES ($1, 'created_goal', $2)",
        [user_id, newGoal.goal_id]
      );
    }

    res.json(newGoal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/goals/:goalId
// @desc    Get a single goal by ID
// @access  Private (must be a member)
router.get('/:goalId', auth, checkGoalMembership(['owner', 'editor', 'viewer']), async (req, res) => {
  try {
    const goal = await db.query('SELECT * FROM goals WHERE goal_id = $1', [req.params.goalId]);
    // No need to check for existence again, middleware did that
    res.json(goal.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/goals
// @desc    Get all goals a user is a member of
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const goals = await db.query(
        `SELECT g.*, gm.role FROM goals g
         JOIN goal_members gm ON g.goal_id = gm.goal_id
         WHERE gm.user_id = $1 ORDER BY g.created_at DESC`,
        [req.user.id]
    );
    res.json(goals.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/goals/:goalId
// @desc    Update a goal
// @access  Private (owner or editor)
router.put('/:goalId', auth, checkGoalMembership(['owner', 'editor']), async (req, res) => {
    const { title, description, is_public } = req.body;
    const { goalId } = req.params;

    try {
        const updatedGoal = await db.query(
            'UPDATE goals SET title = $1, description = $2, is_public = $3 WHERE goal_id = $4 RETURNING *',
            [title, description, is_public, goalId]
        );
        res.json(updatedGoal.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/goals/:goalId/members
// @desc    Get all members for a goal
// @access  Private (must be a member)
router.get('/:goalId/members', auth, checkGoalMembership(['owner', 'editor', 'viewer']), async (req, res) => {
    try {
        const members = await db.query(
            `SELECT u.user_id, u.username, u.avatar_url, gm.role
             FROM goal_members gm
             JOIN users u ON gm.user_id = u.user_id
             WHERE gm.goal_id = $1`,
            [req.params.goalId]
        );
        res.json(members.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/goals/:goalId/join
// @desc    Join a challenge
// @access  Private
router.post('/:goalId/join', auth, async (req, res) => {
    const { goalId } = req.params;
    const userId = req.user.id;

    try {
        // 1. Check if the goal is a challenge
        const goalResult = await db.query('SELECT goal_type FROM goals WHERE goal_id = $1', [goalId]);
        if (goalResult.rows.length === 0 || goalResult.rows[0].goal_type !== 'challenge') {
            return res.status(400).json({ msg: 'This goal is not a challenge.' });
        }

        // 2. Check if user is already a member
        const memberResult = await db.query('SELECT * FROM goal_members WHERE goal_id = $1 AND user_id = $2', [goalId, userId]);
        if (memberResult.rows.length > 0) {
            return res.status(400).json({ msg: 'You are already a participant of this challenge.' });
        }

        // 3. Add user as a participant
        await db.query(
            "INSERT INTO goal_members (goal_id, user_id, role) VALUES ($1, $2, 'participant')",
            [goalId, userId]
        );

        res.json({ msg: 'Successfully joined challenge.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/goals/:goalId/leave
// @desc    Leave a challenge
// @access  Private
router.delete('/:goalId/leave', auth, async (req, res) => {
    const { goalId } = req.params;
    const userId = req.user.id;

    try {
        // 1. Check if the goal is a challenge
        const goalResult = await db.query('SELECT goal_type FROM goals WHERE goal_id = $1', [goalId]);
        if (goalResult.rows.length === 0 || goalResult.rows[0].goal_type !== 'challenge') {
            return res.status(400).json({ msg: 'This goal is not a challenge.' });
        }

        // 2. Check if user is a participant (and not the owner, owners can't leave)
        const memberResult = await db.query(
            "DELETE FROM goal_members WHERE goal_id = $1 AND user_id = $2 AND role = 'participant' RETURNING *",
            [goalId, userId]
        );

        if (memberResult.rowCount === 0) {
            return res.status(400).json({ msg: 'You are not a participant of this challenge or you are the owner.' });
        }

        res.json({ msg: 'Successfully left challenge.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   DELETE api/goals/:goalId
// @desc    Delete a goal
// @access  Private (owner only)
router.delete('/:goalId', auth, checkGoalMembership(['owner']), async (req, res) => {
    const { goalId } = req.params;
    try {
        await db.query('DELETE FROM goals WHERE goal_id = $1', [goalId]);
        res.json({ msg: 'Goal removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
