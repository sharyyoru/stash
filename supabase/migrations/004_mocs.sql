-- Migration: Create MOCs table for LEGO MOC builds
-- Run this in your Supabase SQL Editor

-- Create MOCs table
CREATE TABLE IF NOT EXISTS mocs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  design_features TEXT[] DEFAULT '{}',
  parts_list JSONB DEFAULT '[]',
  instructions JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  videos JSONB DEFAULT '[]',
  cover_image TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for slug lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_mocs_slug ON mocs(slug);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_mocs_status ON mocs(status);

-- Create index for created_at for ordering
CREATE INDEX IF NOT EXISTS idx_mocs_created_at ON mocs(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE mocs ENABLE ROW LEVEL SECURITY;

-- Policy for service role to have full access
CREATE POLICY "Service role has full access to mocs" ON mocs
  FOR ALL USING (true) WITH CHECK (true);

-- Policy for public read access to published MOCs
CREATE POLICY "Public can read published mocs" ON mocs
  FOR SELECT USING (status = 'published');

-- Verify the table was created
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mocs' 
ORDER BY ordinal_position;
