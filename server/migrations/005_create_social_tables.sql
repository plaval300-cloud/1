-- Migration to create tables for social features (followers, likes, comments)

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
