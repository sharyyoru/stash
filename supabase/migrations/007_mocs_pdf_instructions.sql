-- Migration: Add PDF and instruction gallery support to MOCs
-- Run this in your Supabase SQL Editor

-- Add pdf_url column for downloadable PDF instructions
ALTER TABLE mocs ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add instruction_images column for instruction gallery
ALTER TABLE mocs ADD COLUMN IF NOT EXISTS instruction_images JSONB DEFAULT '[]';

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mocs' 
ORDER BY ordinal_position;
