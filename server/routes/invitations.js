const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkGoalMembership } = require('../middleware/permissionMiddleware');
const db = require('../db');

// @route   POST api/invitations
// @desc    Send an invitation to a user for a goal
// @access  Private (owner of the goal)
router.post('/', auth, async (req, res) => {
    const { goalId, inviteeUsername } = req.body;
    const inviterId = req.user.id;

    try {
        // 1. Check if inviter is the owner of the goal
        const ownerCheck = await db.query(
            "SELECT * FROM goal_members WHERE goal_id = $1 AND user_id = $2 AND role = 'owner'",
            [goalId, inviterId]
        );
        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Only the goal owner can send invitations.' });
        }

        // 2. Find the user to invite by their username
        const inviteeResult = await db.query('SELECT user_id FROM users WHERE username = $1', [inviteeUsername]);
        if (inviteeResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User to invite not found.' });
        }
        const inviteeId = inviteeResult.rows[0].user_id;

        // 3. Check if user is already a member
        const memberCheck = await db.query('SELECT * FROM goal_members WHERE goal_id = $1 AND user_id = $2', [goalId, inviteeId]);
        if (memberCheck.rows.length > 0) {
            return res.status(400).json({ msg: 'User is already a member of this goal.' });
        }

        // 4. Create the invitation
        const newInvitation = await db.query(
            'INSERT INTO goal_invitations (goal_id, inviter_id, invitee_id) VALUES ($1, $2, $3) RETURNING *',
            [goalId, inviterId, inviteeId]
        );

        res.status(201).json(newInvitation.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/invitations
// @desc    Get pending invitations for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const invitations = await db.query(
            `SELECT i.*, g.title as goal_title, u.username as inviter_username
             FROM goal_invitations i
             JOIN goals g ON i.goal_id = g.goal_id
             JOIN users u ON i.inviter_id = u.user_id
             WHERE i.invitee_id = $1 AND i.status = 'pending'`,
            [req.user.id]
        );
        res.json(invitations.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/invitations/:invitationId
// @desc    Respond to an invitation
// @access  Private
router.put('/:invitationId', auth, async (req, res) => {
    const { status } = req.body; // 'accepted' or 'declined'
    const { invitationId } = req.params;

    if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status.' });
    }

    try {
        // 1. Verify the invitation exists and is for the logged-in user
        const invResult = await db.query(
            "SELECT * FROM goal_invitations WHERE invitation_id = $1 AND invitee_id = $2 AND status = 'pending'",
            [invitationId, req.user.id]
        );
        if (invResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Invitation not found or you are not authorized to respond.' });
        }
        const invitation = invResult.rows[0];

        // 2. Update the invitation status
        await db.query('UPDATE goal_invitations SET status = $1 WHERE invitation_id = $2', [status, invitationId]);

        // 3. If accepted, add the user to goal_members
        if (status === 'accepted') {
            await db.query(
                "INSERT INTO goal_members (goal_id, user_id, role) VALUES ($1, $2, 'editor')", // Default role for new members
                [invitation.goal_id, req.user.id]
            );
        }

        res.json({ msg: `Invitation ${status}.` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
