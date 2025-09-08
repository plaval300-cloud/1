const express = require('express');
const router = express.Router({ mergeParams: true });
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

// GET /api/goals/:goalId/notes - Get all notes for a goal
router.get('/', auth, checkGoalOwnership, async (req, res) => {
    try {
        const notes = await db.query('SELECT * FROM notes WHERE goal_id = $1 ORDER BY created_at DESC', [req.params.goalId]);
        res.json(notes.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/goals/:goalId/notes - Create a note for a goal
router.post('/', auth, checkGoalOwnership, async (req, res) => {
    const { title, content_type, content } = req.body;
    if (!title || !content_type) {
        return res.status(400).json({ msg: 'Please provide a title and content type.' });
    }

    try {
        const newNote = await db.query(
            'INSERT INTO notes (goal_id, title, content_type, content) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.params.goalId, title, content_type, content || null]
        );
        res.status(201).json(newNote.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


const noteRouter = express.Router();

// Middleware to check if the note belongs to the user
const checkNoteOwnership = async (req, res, next) => {
    try {
        const noteResult = await db.query(
            `SELECT n.note_id FROM notes n JOIN goals g ON n.goal_id = g.goal_id
             WHERE n.note_id = $1 AND g.user_id = $2`,
            [req.params.noteId, req.user.id]
        );
        if (noteResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Note not found or user not authorized.' });
        }
        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// GET /api/notes/:noteId
noteRouter.get('/:noteId', auth, checkNoteOwnership, async (req, res) => {
    try {
        const note = await db.query('SELECT * FROM notes WHERE note_id = $1', [req.params.noteId]);
        res.json(note.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /api/notes/:noteId
noteRouter.put('/:noteId', auth, checkNoteOwnership, async (req, res) => {
    const { title, content } = req.body;
    try {
        const updatedNote = await db.query(
            'UPDATE notes SET title = $1, content = $2 WHERE note_id = $3 RETURNING *',
            [title, content, req.params.noteId]
        );
        res.json(updatedNote.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /api/notes/:noteId
noteRouter.delete('/:noteId', auth, checkNoteOwnership, async (req, res) => {
    try {
        await db.query('DELETE FROM notes WHERE note_id = $1', [req.params.noteId]);
        res.json({ msg: 'Note removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = { nested: router, direct: noteRouter };
