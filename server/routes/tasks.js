const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams allows us to get goalId from the parent router
const auth = require('../middleware/auth');
const { checkGoalMembership } = require('../middleware/permissionMiddleware');
const db = require('../db');


// GET /api/goals/:goalId/tasks - Get all tasks for a goal
router.get('/', auth, checkGoalMembership(['owner', 'editor', 'viewer']), async (req, res) => {
    try {
        const tasks = await db.query('SELECT * FROM tasks WHERE goal_id = $1 ORDER BY created_at ASC', [req.params.goalId]);
        res.json(tasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/goals/:goalId/tasks - Create a task for a goal
router.post('/', auth, checkGoalMembership(['owner', 'editor']), async (req, res) => {
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

// Middleware to check task permissions
const checkTaskPermission = (requiredRoles) => async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { id: userId } = req.user;

        const taskResult = await db.query('SELECT goal_id FROM tasks WHERE task_id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Task not found.' });
        }
        const { goal_id } = taskResult.rows[0];

        const memberResult = await db.query(
            'SELECT role FROM goal_members WHERE goal_id = $1 AND user_id = $2',
            [goal_id, userId]
        );

        if (memberResult.rows.length === 0) {
            return res.status(403).json({ msg: 'You are not a member of this goal.' });
        }

        const userRole = memberResult.rows[0].role;
        if (!requiredRoles.includes(userRole)) {
            return res.status(403).json({ msg: 'You do not have the required permissions for this action.' });
        }

        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}


// PUT /api/tasks/:taskId - Update a task
taskRouter.put('/:taskId', auth, checkTaskPermission(['owner', 'editor']), async (req, res) => {
    const { description, is_completed, status } = req.body;
    const { taskId } = req.params;

    try {
        const taskResult = await db.query('SELECT * FROM tasks WHERE task_id = $1', [taskId]);
        const currentTask = taskResult.rows[0];

        const newDescription = description !== undefined ? description : currentTask.description;
        const newCompleted = is_completed !== undefined ? is_completed : currentTask.is_completed;
        const newStatus = status !== undefined ? status : currentTask.status;

        const updatedTaskResult = await db.query(
            'UPDATE tasks SET description = $1, is_completed = $2, status = $3 WHERE task_id = $4 RETURNING *',
            [newDescription, newCompleted, newStatus, taskId]
        );
        const updatedTask = updatedTaskResult.rows[0];

        // Emit the update to the goal's room
        const room = `goal:${currentTask.goal_id}`;
        req.io.to(room).emit('task_updated', updatedTask);

        res.json(updatedTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /api/tasks/:taskId - Delete a task
taskRouter.delete('/:taskId', auth, checkTaskPermission(['owner', 'editor']), async (req, res) => {
    const { taskId } = req.params;
    try {
        await db.query('DELETE FROM tasks WHERE task_id = $1', [taskId]);
        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// Export both routers
module.exports = { nested: router, direct: taskRouter };
