-- Migration to create the 'notes' table for diagrams and visual notes

CREATE TABLE notes (
    note_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    goal_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'excalidraw' or 'mermaid'
    content JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE
);
