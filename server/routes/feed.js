const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// @route   GET api/feed
// @desc    Get the activity feed
// @access  Private (to allow for personalization later, e.g. 'following' feed)
router.get('/', auth, async (req, res) => {
    try {
        const feedQuery = `
            SELECT
                e.event_id,
                e.action_type,
                e.created_at,
                u.user_id,
                u.username,
                u.avatar_url,
                a.article_id,
                a.title as article_title,
                a.slug as article_slug,
                g.goal_id,
                g.title as goal_title,
                g.goal_type
            FROM events e
            JOIN users u ON e.user_id = u.user_id
            LEFT JOIN articles a ON e.subject_id = a.article_id AND e.action_type = 'published_article'
            LEFT JOIN goals g ON e.subject_id = g.goal_id AND e.action_type = 'created_goal'
            ORDER BY e.created_at DESC
            LIMIT 20
        `;
        const feed = await db.query(feedQuery);
        res.json(feed.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
