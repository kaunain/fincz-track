-- Set mfa_enabled to false for all existing users where it is currently NULL
UPDATE users 
SET mfa_enabled = false 
WHERE mfa_enabled IS NULL;

-- Ensure future records default to false and do not allow NULL values
ALTER TABLE users ALTER COLUMN mfa_enabled SET DEFAULT false;
ALTER TABLE users ALTER COLUMN mfa_enabled SET NOT NULL;