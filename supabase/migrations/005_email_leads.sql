-- Email leads table for exit-intent popups and lead capture
CREATE TABLE IF NOT EXISTS email_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('exit_popup_shop', 'exit_popup_subscription', 'newsletter', 'other')),
  discount_code TEXT,
  page_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  welcome_email_sent BOOLEAN DEFAULT FALSE,
  welcome_email_sent_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_email_leads_email ON email_leads(email);
CREATE INDEX IF NOT EXISTS idx_email_leads_source ON email_leads(source);
CREATE INDEX IF NOT EXISTS idx_email_leads_created_at ON email_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_email_leads_welcome_sent ON email_leads(welcome_email_sent);

-- Product view analytics table
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug TEXT NOT NULL,
  product_title TEXT,
  session_id TEXT,
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for view analytics
CREATE INDEX IF NOT EXISTS idx_product_views_slug ON product_views(product_slug);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON product_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_product_views_session ON product_views(session_id);

-- Enable RLS
ALTER TABLE email_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- Policy for service role
CREATE POLICY "Service role has full access to email_leads" ON email_leads
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to product_views" ON product_views
  FOR ALL USING (true) WITH CHECK (true);

-- Discount codes table for tracking
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  description TEXT,
  source TEXT,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to discount_codes" ON discount_codes
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default exit-intent discount codes
INSERT INTO discount_codes (code, discount_type, discount_value, description, source) 
VALUES 
  ('STASH10', 'percentage', 10, '10% off for new email subscribers from shop', 'exit_popup_shop'),
  ('FIRSTMONTH15', 'percentage', 15, '15% off first month subscription', 'exit_popup_subscription')
ON CONFLICT (code) DO NOTHING;
