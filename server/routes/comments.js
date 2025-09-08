const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// @route   GET api/comments/:contentType/:contentId
// @desc    Get all comments for a piece of content
// @access  Public
router.get('/:contentType/:contentId', async (req, res) => {
    const { contentType, contentId } = req.params;
    try {
        const comments = await db.query(
            `SELECT c.*, u.username, u.avatar_url
             FROM comments c JOIN users u ON c.user_id = u.user_id
             WHERE c.content_type = $1 AND c.content_id = $2
             ORDER BY c.created_at ASC`,
            [contentType, contentId]
        );
        res.json(comments.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/comments
// @desc    Create a comment
// @access  Private
router.post('/', auth, async (req, res) => {
    const { content_type, content_id, parent_comment_id, body } = req.body;
    const user_id = req.user.id;

    if (!content_type || !content_id || !body) {
        return res.status(400).json({ msg: 'Content type, content ID, and body are required.' });
    }

    try {
        const newCommentResult = await db.query(
            'INSERT INTO comments (user_id, content_type, content_id, parent_comment_id, body) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_id, content_type, content_id, parent_comment_id || null, body]
        );

        // Fetch the full comment with user info to emit
        const fullComment = await db.query(
            `SELECT c.*, u.username, u.avatar_url FROM comments c JOIN users u ON c.user_id = u.user_id WHERE c.comment_id = $1`,
            [newCommentResult.rows[0].comment_id]
        );
        const newComment = fullComment.rows[0];

        // Emit the new comment to the corresponding room
        const room = `${content_type}:${content_id}`;
        req.io.to(room).emit('new_comment', newComment);

        res.status(201).json(newComment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete('/:commentId', auth, async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM comments WHERE comment_id = $1 AND user_id = $2',
            [req.params.commentId, req.user.id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ msg: 'Comment not found or user not authorized to delete.' });
        }
        res.json({ msg: 'Comment deleted.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
