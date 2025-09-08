const db = require('../db');

const checkGoalMembership = (requiredRoles) => async (req, res, next) => {
    try {
        const goalId = req.params.goalId || req.body.goal_id; // Handle different ways of getting goalId
        const userId = req.user.id;

        if (!goalId) {
            return res.status(400).json({ msg: 'Goal ID is required.' });
        }

        const memberResult = await db.query(
            'SELECT role FROM goal_members WHERE goal_id = $1 AND user_id = $2',
            [goalId, userId]
        );

        if (memberResult.rows.length === 0) {
            return res.status(403).json({ msg: 'You are not a member of this goal.' });
        }

        const userRole = memberResult.rows[0].role;
        if (!requiredRoles.includes(userRole)) {
            return res.status(403).json({ msg: 'You do not have the required permissions for this action.' });
        }

        // Attach role to request object for potential use in the route handler
        req.goal_role = userRole;
        next();

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { checkGoalMembership };
