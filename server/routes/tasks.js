const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams allows us to get goalId from the parent router
const auth = require('../middleware/auth');
const db = require('../db');

// Middleware to check if the goal belongs to the user
const checkGoalOwnership = async (req, res, next) => {
    try {
        const goal = await db.query('SELECT * FROM goals WHERE goal_id = $1 AND user_id = $2', [req.params.goalId, req.user.id]);
        if (goal.rows.length === 0) {
            return res.status(404).json({ msg: 'Goal not found or user not authorized.' });
        }
        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// GET /api/goals/:goalId/tasks - Get all tasks for a goal
router.get('/', auth, checkGoalOwnership, async (req, res) => {
    try {
        const tasks = await db.query('SELECT * FROM tasks WHERE goal_id = $1 ORDER BY created_at ASC', [req.params.goalId]);
        res.json(tasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/goals/:goalId/tasks - Create a task for a goal
router.post('/', auth, checkGoalOwnership, async (req, res) => {
    const { description } = req.body;
    if (!description) {
        return res.status(400).json({ msg: 'Please provide a description for the task.' });
    }

    try {
        const newTask = await db.query(
            'INSERT INTO tasks (goal_id, description) VALUES ($1, $2) RETURNING *',
            [req.params.goalId, description]
        );
        res.status(201).json(newTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// This part of the router will handle routes like /api/tasks/:taskId
const taskRouter = express.Router();

// PUT /api/tasks/:taskId - Update a task
taskRouter.put('/:taskId', auth, async (req, res) => {
    const { description, is_completed } = req.body;
    const { taskId } = req.params;

    try {
        // First, verify the task exists and belongs to the user
        const taskResult = await db.query(
            `SELECT t.task_id FROM tasks t JOIN goals g ON t.goal_id = g.goal_id
             WHERE t.task_id = $1 AND g.user_id = $2`,
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Task not found or user not authorized.' });
        }

        const updatedTask = await db.query(
            'UPDATE tasks SET description = $1, is_completed = $2 WHERE task_id = $3 RETURNING *',
            [description, is_completed, taskId]
        );

        res.json(updatedTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /api/tasks/:taskId - Delete a task
taskRouter.delete('/:taskId', auth, async (req, res) => {
    const { taskId } = req.params;

    try {
        const taskResult = await db.query(
            `SELECT t.task_id FROM tasks t JOIN goals g ON t.goal_id = g.goal_id
             WHERE t.task_id = $1 AND g.user_id = $2`,
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Task not found or user not authorized.' });
        }

        await db.query('DELETE FROM tasks WHERE task_id = $1', [taskId]);
        res.json({ msg: 'Task removed' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// Export both routers
module.exports = { nested: router, direct: taskRouter };
