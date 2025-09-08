-- Migration to create the 'events' table for the activity feed

CREATE TABLE events (
    event_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- e.g., 'published_article', 'created_goal'
    subject_id UUID NOT NULL, -- The ID of the article or goal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
