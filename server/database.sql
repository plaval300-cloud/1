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
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
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
