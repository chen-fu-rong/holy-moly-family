-- Add members column to families table if it does not exist
ALTER TABLE families ADD COLUMN IF NOT EXISTS members JSONB DEFAULT '[]'::jsonb;
