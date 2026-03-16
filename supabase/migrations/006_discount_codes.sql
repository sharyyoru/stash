-- Migration: Create discount codes system
-- Run this in your Supabase SQL Editor

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order_amount NUMERIC(10, 2) DEFAULT 0,
  max_discount_amount NUMERIC(10, 2), -- For percentage discounts, cap the max discount
  usage_limit INTEGER, -- NULL means unlimited
  usage_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'products', 'subscriptions')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for code lookups
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);

-- Create index for active codes
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active);

-- Create discount_code_usage table to track individual uses
CREATE TABLE IF NOT EXISTS discount_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  user_email TEXT,
  discount_amount NUMERIC(10, 2) NOT NULL,
  original_amount NUMERIC(10, 2) NOT NULL,
  final_amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for usage tracking
CREATE INDEX IF NOT EXISTS idx_discount_usage_code ON discount_code_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_order ON discount_code_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_email ON discount_code_usage(user_email);
CREATE INDEX IF NOT EXISTS idx_discount_usage_created ON discount_code_usage(created_at);

-- Add discount columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2);

-- Enable RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_usage ENABLE ROW LEVEL SECURITY;

-- Policies for discount_codes
CREATE POLICY "Service role has full access to discount_codes" ON discount_codes
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for discount_code_usage
CREATE POLICY "Service role has full access to discount_code_usage" ON discount_code_usage
  FOR ALL USING (true) WITH CHECK (true);

-- Insert a sample 10% discount code
INSERT INTO discount_codes (code, description, discount_type, discount_value, is_active)
VALUES ('STASH10', '10% off your order', 'percentage', 10, true)
ON CONFLICT (code) DO NOTHING;

-- Verify tables were created
SELECT 'discount_codes' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'discount_codes' 
ORDER BY ordinal_position;
