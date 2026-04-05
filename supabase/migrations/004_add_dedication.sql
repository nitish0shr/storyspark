-- Add dedication text field to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS dedication TEXT DEFAULT NULL;
