-- Migration to add challenge-related fields to the 'goals' table

ALTER TABLE goals
ADD COLUMN goal_type VARCHAR(50) NOT NULL DEFAULT 'personal',
ADD COLUMN start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
