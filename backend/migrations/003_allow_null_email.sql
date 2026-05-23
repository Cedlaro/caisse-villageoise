-- Allow email to be NULL in members table (email is optional since v2)
ALTER TABLE members MODIFY COLUMN email VARCHAR(255) NULL;
