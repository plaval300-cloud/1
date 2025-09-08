const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const db = require('../db');

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await db.query('SELECT user_id, username, email, full_name, bio, avatar_url, website_url, created_at FROM users WHERE user_id = $1', [req.user.id]);
        if (profile.rows.length === 0) {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.json(profile.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/me
// @desc    Update current user's profile
// @access  Private
router.put('/me', auth, async (req, res) => {
    const { full_name, bio, website_url } = req.body;
    try {
        const updatedProfile = await db.query(
            'UPDATE users SET full_name = $1, bio = $2, website_url = $3 WHERE user_id = $4 RETURNING user_id, username, email, full_name, bio, avatar_url, website_url',
            [full_name, bio, website_url, req.user.id]
        );
        res.json(updatedProfile.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/profile/me/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/me/avatar', [auth, upload.single('avatar')], async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'Please upload a file' });
    }
    try {
        const avatar_url = `/uploads/${req.file.filename}`;
        const updatedProfile = await db.query(
            'UPDATE users SET avatar_url = $1 WHERE user_id = $2 RETURNING avatar_url',
            [avatar_url, req.user.id]
        );
        res.json(updatedProfile.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET api/profile/user/:userId
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:userId', async (req, res) => {
    try {
        const profile = await db.query(
            'SELECT user_id, username, full_name, bio, avatar_url, website_url, created_at FROM users WHERE user_id = $1',
            [req.params.userId]
        );

        if (profile.rows.length === 0) {
            return res.status(404).json({ msg: 'Profile not found' });
        }
        res.json(profile.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
