const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// @route   POST api/likes
// @desc    Like or unlike a piece of content
// @access  Private
router.post('/', auth, async (req, res) => {
    const { content_type, content_id } = req.body;
    const user_id = req.user.id;

    if (!content_type || !content_id) {
        return res.status(400).json({ msg: 'Content type and ID are required.' });
    }

    try {
        // Check if the like already exists
        const existingLike = await db.query(
            'SELECT * FROM likes WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
            [user_id, content_type, content_id]
        );

        let isLiked;
        if (existingLike.rows.length > 0) {
            // If it exists, unlike it (delete the row)
            await db.query(
                'DELETE FROM likes WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
                [user_id, content_type, content_id]
            );
            isLiked = false;
        } else {
            // If it does not exist, like it (insert a new row)
            await db.query(
                'INSERT INTO likes (user_id, content_type, content_id) VALUES ($1, $2, $3)',
                [user_id, content_type, content_id]
            );
            isLiked = true;
        }

        // Get the new like count
        const likeCountResult = await db.query(
            'SELECT COUNT(*) FROM likes WHERE content_type = $1 AND content_id = $2',
            [content_type, content_id]
        );
        const likeCount = parseInt(likeCountResult.rows[0].count, 10);

        // Emit the update to the room
        const room = `${content_type}:${content_id}`;
        req.io.to(room).emit('update_like', { content_id, likeCount });

        res.json({ msg: `Action successful.`, isLiked, likeCount });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
