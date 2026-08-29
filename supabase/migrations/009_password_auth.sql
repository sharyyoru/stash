-- Migration: Add password authentication fields to profiles table
-- Run this in your Supabase SQL Editor

-- Add password authentication columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

-- Create index for password reset token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token ON profiles(password_reset_token);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('password_hash', 'password_reset_token', 'password_reset_expires')
ORDER BY ordinal_position;
