-- Subscriptions table for monthly recurring payments
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  product_id TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  product_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'paused', 'cancelled', 'past_due', 'pending')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  billing_day INTEGER NOT NULL CHECK (billing_day >= 1 AND billing_day <= 28),
  next_billing_date DATE NOT NULL,
  last_billing_date DATE,
  profile JSONB,
  current_payment_intent_id TEXT,
  last_payment_status TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_email ON subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_intent ON subscriptions(current_payment_intent_id);

-- Subscription payments table for tracking individual payment attempts
CREATE TABLE IF NOT EXISTS subscription_payments (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  payment_intent_id TEXT,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL
);

-- Indexes for subscription payments
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_intent ON subscription_payments(payment_intent_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Policy for service role to have full access
CREATE POLICY "Service role has full access to subscriptions" ON subscriptions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to subscription_payments" ON subscription_payments
  FOR ALL USING (true) WITH CHECK (true);
