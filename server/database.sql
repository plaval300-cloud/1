-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Table
CREATE TABLE users (
    user_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    website_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Goal Table
CREATE TABLE goals (
    goal_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL, -- The original creator
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    goal_type VARCHAR(50) NOT NULL DEFAULT 'personal', -- 'personal', 'challenge'
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

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

-- Task Table
CREATE TABLE tasks (
    task_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    goal_id UUID NOT NULL,
    description TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'To Do',
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE
);

-- Followers Table
CREATE TABLE followers (
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Likes Table (Polymorphic)
CREATE TABLE likes (
    user_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'article', 'goal', 'comment'
    content_id UUID NOT NULL,
    PRIMARY KEY (user_id, content_type, content_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Comments Table (Polymorphic)
CREATE TABLE comments (
    comment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_id UUID NOT NULL,
    parent_comment_id UUID, -- For threaded comments
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(comment_id) ON DELETE CASCADE
);

-- Events Table for the activity feed
CREATE TABLE events (
    event_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- e.g., 'published_article', 'created_goal'
    subject_id UUID NOT NULL, -- The ID of the article or goal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Article Table for blog posts and publications
CREATE TABLE articles (
    article_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'published'
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Trigger to update 'updated_at' timestamp on row update
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_articles_timestamp
BEFORE UPDATE ON articles
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Note Table for diagrams and visual notes
CREATE TABLE notes (
    note_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    goal_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'excalidraw' or 'mermaid'
    content JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE
);
