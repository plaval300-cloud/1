-- Migration to add the 'status' column to the 'tasks' table
ALTER TABLE tasks
ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'To Do';
