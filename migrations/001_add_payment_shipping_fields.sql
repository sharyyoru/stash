-- Migration: Add Ziina Payment and Jeebly Shipping fields to orders table
-- Run this in your Supabase SQL Editor

-- Add Ziina payment fields
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT;

-- Add Jeebly shipping fields
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS awb_number TEXT,
ADD COLUMN IF NOT EXISTS shipping_status TEXT;

-- Create index for payment intent lookups (used by webhooks)
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON orders(payment_intent_id);

-- Create index for AWB lookups
CREATE INDEX IF NOT EXISTS idx_orders_awb_number ON orders(awb_number);

-- Update status column to support new statuses if needed
-- The status column should support: 'payment-pending', 'paid', 'processing', 'in-transit', 'delivered', 'cancelled'

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
