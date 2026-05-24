-- Add starting volume columns to secret_stash_subscriptions table
ALTER TABLE secret_stash_subscriptions 
ADD COLUMN IF NOT EXISTS starting_volume_id TEXT,
ADD COLUMN IF NOT EXISTS starting_volume_title TEXT;

-- Create index for volume queries
CREATE INDEX IF NOT EXISTS idx_secret_stash_subscriptions_volume 
ON secret_stash_subscriptions(starting_volume_id);
