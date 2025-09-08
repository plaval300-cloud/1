-- Migration to create tables for collaboration features (goal_members, goal_invitations)

-- Goal Membership Table
CREATE TABLE goal_members (
    goal_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- 'owner', 'editor', 'viewer', 'participant'
    PRIMARY KEY (goal_id, user_id),
    FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Goal Invitations Table
CREATE TABLE goal_invitations (
    invitation_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    goal_id UUID NOT NULL,
    inviter_id UUID NOT NULL,
    invitee_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE,
    FOREIGN KEY (inviter_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (invitee_id) REFERENCES users(user_id) ON DELETE CASCADE
);
