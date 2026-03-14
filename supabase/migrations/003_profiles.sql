-- Migration: Create profiles table for user addresses and profile data
-- Run this in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for email lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create index for created_at for ordering
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for service role to have full access
CREATE POLICY "Service role has full access to profiles" ON profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Verify the table was created
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
