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
router.get('/user/:userId', auth, async (req, res) => { // Made private to know who is asking
    try {
        const requestingUserId = req.user ? req.user.id : null;
        const profileUserId = req.params.userId;

        const profileQuery = `
            SELECT
                u.user_id, u.username, u.full_name, u.bio, u.avatar_url, u.website_url, u.created_at,
                (SELECT COUNT(*) FROM followers WHERE following_id = u.user_id) as follower_count,
                (SELECT COUNT(*) FROM followers WHERE follower_id = u.user_id) as following_count,
                EXISTS(SELECT 1 FROM followers WHERE follower_id = $1 AND following_id = u.user_id) as is_following
            FROM users u
            WHERE u.user_id = $2
        `;

        const profile = await db.query(profileQuery, [requestingUserId, profileUserId]);

        if (profile.rows.length === 0) {
            return res.status(404).json({ msg: 'Profile not found' });
        }

        // Convert counts to integers as they come back as strings from COUNT(*)
        const profileData = profile.rows[0];
        profileData.follower_count = parseInt(profileData.follower_count, 10);
        profileData.following_count = parseInt(profileData.following_count, 10);

        res.json(profileData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/profile/:userId/follow
// @desc    Follow a user
// @access  Private
router.post('/:userId/follow', auth, async (req, res) => {
    const userToFollowId = req.params.userId;
    const currentUserId = req.user.id;

    if (userToFollowId === currentUserId) {
        return res.status(400).json({ msg: 'You cannot follow yourself.' });
    }

    try {
        // Check if already following
        const alreadyFollowing = await db.query('SELECT * FROM followers WHERE follower_id = $1 AND following_id = $2', [currentUserId, userToFollowId]);
        if (alreadyFollowing.rows.length > 0) {
            return res.status(400).json({ msg: 'You are already following this user.' });
        }

        await db.query('INSERT INTO followers (follower_id, following_id) VALUES ($1, $2)', [currentUserId, userToFollowId]);
        res.json({ msg: 'User followed.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/profile/:userId/follow
// @desc    Unfollow a user
// @access  Private
router.delete('/:userId/follow', auth, async (req, res) => {
    const userToUnfollowId = req.params.userId;
    const currentUserId = req.user.id;

    try {
        const result = await db.query('DELETE FROM followers WHERE follower_id = $1 AND following_id = $2', [currentUserId, userToUnfollowId]);
        if (result.rowCount === 0) {
            return res.status(400).json({ msg: 'You are not following this user.' });
        }
        res.json({ msg: 'User unfollowed.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
