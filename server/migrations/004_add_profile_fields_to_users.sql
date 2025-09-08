-- Migration to add profile fields to the 'users' table

ALTER TABLE users
ADD COLUMN full_name VARCHAR(100),
ADD COLUMN bio TEXT,
ADD COLUMN avatar_url TEXT,
ADD COLUMN website_url VARCHAR(255);
