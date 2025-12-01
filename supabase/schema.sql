-- MyHomeQuoter Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Niches table
CREATE TABLE IF NOT EXISTS niches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_per_lead DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default niches
INSERT INTO niches (slug, name, price_per_lead) VALUES
  ('solar', 'Solar Panels', 75.00),
  ('roofing', 'Roofing', 65.00),
  ('hvac', 'HVAC', 55.00),
  ('windows', 'Windows & Doors', 50.00),
  ('plumbing', 'Plumbing', 45.00),
  ('electrical', 'Electrical', 50.00),
  ('masonry', 'Masonry', 40.00),
  ('siding', 'Siding', 45.00),
  ('insulation', 'Insulation', 40.00),
  ('gutters', 'Gutters', 35.00)
ON CONFLICT (slug) DO NOTHING;

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  niche_id UUID REFERENCES niches(id),

  -- Contact info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- Location
  address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,

  -- Qualification
  project_type TEXT NOT NULL,
  timeline TEXT NOT NULL,
  budget_range TEXT,
  property_type TEXT NOT NULL,
  additional_info TEXT,

  -- Tracking
  source_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address TEXT,
  user_agent TEXT,

  -- Status
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'sold', 'invalid')),
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_niche ON leads(niche_id);
CREATE INDEX IF NOT EXISTS idx_leads_state ON leads(state);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- Buyers table (contractors who buy leads)
CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  -- Stripe
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,

  -- Preferences
  target_niches UUID[] DEFAULT '{}',
  target_states TEXT[] DEFAULT '{}',
  target_cities TEXT[],
  max_leads_per_day INTEGER,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'suspended')),
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for buyer lookups
CREATE INDEX IF NOT EXISTS idx_buyers_user ON buyers(user_id);
CREATE INDEX IF NOT EXISTS idx_buyers_status ON buyers(status);
CREATE INDEX IF NOT EXISTS idx_buyers_stripe ON buyers(stripe_customer_id);

-- Lead claims table (tracks which buyer claimed which lead)
CREATE TABLE IF NOT EXISTS lead_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,

  price DECIMAL(10,2) NOT NULL,

  -- Billing
  invoice_id TEXT,
  billed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(lead_id) -- Each lead can only be claimed once
);

-- Create index for claim lookups
CREATE INDEX IF NOT EXISTS idx_claims_buyer ON lead_claims(buyer_id);
CREATE INDEX IF NOT EXISTS idx_claims_lead ON lead_claims(lead_id);
CREATE INDEX IF NOT EXISTS idx_claims_billed ON lead_claims(billed_at);

-- Articles table (for SEO content)
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  niche_id UUID REFERENCES niches(id),

  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  content TEXT NOT NULL,

  -- SEO
  target_keywords TEXT[] DEFAULT '{}',
  target_city TEXT,
  target_state TEXT,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  published_at TIMESTAMPTZ,

  -- AI Generation
  ai_generated BOOLEAN DEFAULT TRUE,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for article lookups
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_niche ON articles(niche_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_location ON articles(target_state, target_city);

-- US Cities table (for local landing pages)
CREATE TABLE IF NOT EXISTS us_cities (
  id SERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  state_code TEXT NOT NULL,
  population INTEGER NOT NULL DEFAULT 0,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  UNIQUE(city, state_code)
);

-- Create index for city lookups
CREATE INDEX IF NOT EXISTS idx_cities_state ON us_cities(state_code);
CREATE INDEX IF NOT EXISTS idx_cities_population ON us_cities(population DESC);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Leads: Only admins can view all, service role can insert
CREATE POLICY "Service role can insert leads"
  ON leads FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read leads"
  ON leads FOR SELECT
  TO service_role
  USING (true);

-- Buyers: Users can only see their own buyer profile
CREATE POLICY "Users can view own buyer profile"
  ON buyers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own buyer profile"
  ON buyers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to buyers"
  ON buyers FOR ALL
  TO service_role
  USING (true);

-- Lead Claims: Buyers can only see their own claims
CREATE POLICY "Buyers can view own claims"
  ON lead_claims FOR SELECT
  USING (
    buyer_id IN (
      SELECT id FROM buyers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to claims"
  ON lead_claims FOR ALL
  TO service_role
  USING (true);

-- Articles: Public read for published, admin write
CREATE POLICY "Anyone can read published articles"
  ON articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Service role full access to articles"
  ON articles FOR ALL
  TO service_role
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for articles updated_at
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
