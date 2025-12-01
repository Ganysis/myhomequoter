/**
 * Supabase Article Tracking for Blog Generation
 *
 * Tracks generated articles to:
 * - Avoid duplicates
 * - Monitor quality scores over time
 * - Track performance metrics
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Types for article tracking
export interface ArticleRecord {
  id?: string;
  slug: string;
  title: string;
  category: string;
  silo_type: 'pillar' | 'cluster' | 'supporting';
  quality_score: number;
  word_count: number;
  generated_at: string;
  published: boolean;
  source_inspiration?: string;
  regeneration_attempts: number;
}

export interface ArticleStats {
  totalArticles: number;
  avgQualityScore: number;
  articlesByCategory: Record<string, number>;
  articlesBySilo: Record<string, number>;
  recentArticles: ArticleRecord[];
}

// Singleton client
let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client for scripts
 * Uses environment variables (process.env)
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.log('   ℹ️ Supabase not configured (SUPABASE_URL/SUPABASE_SERVICE_KEY)');
    console.log('   Tracking disabled - articles will still be generated.');
    return null;
  }

  supabaseClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}

/**
 * Check if an article slug already exists
 */
export async function articleExists(slug: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { data, error } = await client
      .from('blog_articles')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('   Error checking article:', error.message);
      return false;
    }

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Track a newly generated article
 */
export async function trackArticle(article: Omit<ArticleRecord, 'id'>): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    console.log('   ⚠️ Supabase not configured - skipping tracking');
    return false;
  }

  try {
    const { error } = await client
      .from('blog_articles')
      .upsert(article, { onConflict: 'slug' });

    if (error) {
      console.error('   Error tracking article:', error.message);
      return false;
    }

    console.log('   📊 Article tracked in Supabase');
    return true;
  } catch (err) {
    console.error('   Error tracking article:', err);
    return false;
  }
}

/**
 * Get articles that have already been generated
 */
export async function getGeneratedSlugs(): Promise<string[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('blog_articles')
      .select('slug');

    if (error) {
      console.error('   Error fetching slugs:', error.message);
      return [];
    }

    return data?.map(d => d.slug) || [];
  } catch {
    return [];
  }
}

/**
 * Get article generation statistics
 */
export async function getArticleStats(): Promise<ArticleStats | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // Get all articles
    const { data: articles, error } = await client
      .from('blog_articles')
      .select('*')
      .order('generated_at', { ascending: false });

    if (error) {
      console.error('   Error fetching stats:', error.message);
      return null;
    }

    if (!articles || articles.length === 0) {
      return {
        totalArticles: 0,
        avgQualityScore: 0,
        articlesByCategory: {},
        articlesBySilo: {},
        recentArticles: [],
      };
    }

    // Calculate stats
    const totalArticles = articles.length;
    const avgQualityScore = Math.round(
      articles.reduce((sum, a) => sum + (a.quality_score || 0), 0) / totalArticles
    );

    const articlesByCategory: Record<string, number> = {};
    const articlesBySilo: Record<string, number> = {};

    for (const article of articles) {
      articlesByCategory[article.category] = (articlesByCategory[article.category] || 0) + 1;
      articlesBySilo[article.silo_type] = (articlesBySilo[article.silo_type] || 0) + 1;
    }

    return {
      totalArticles,
      avgQualityScore,
      articlesByCategory,
      articlesBySilo,
      recentArticles: articles.slice(0, 10) as ArticleRecord[],
    };
  } catch (err) {
    console.error('   Error calculating stats:', err);
    return null;
  }
}

/**
 * Print article statistics to console
 */
export async function printArticleStats(): Promise<void> {
  const stats = await getArticleStats();

  if (!stats) {
    console.log('\n📊 Supabase tracking not available');
    return;
  }

  console.log('\n📊 ARTICLE GENERATION STATS');
  console.log('═'.repeat(40));
  console.log(`Total articles: ${stats.totalArticles}`);
  console.log(`Average quality: ${stats.avgQualityScore}/100`);

  console.log('\nBy Category:');
  for (const [cat, count] of Object.entries(stats.articlesByCategory)) {
    const pct = Math.round((count / stats.totalArticles) * 100);
    console.log(`  ${cat}: ${count} (${pct}%)`);
  }

  console.log('\nBy Silo Type:');
  for (const [silo, count] of Object.entries(stats.articlesBySilo)) {
    console.log(`  ${silo}: ${count}`);
  }

  if (stats.recentArticles.length > 0) {
    console.log('\nRecent Articles:');
    for (const article of stats.recentArticles.slice(0, 5)) {
      console.log(`  - ${article.title} (${article.quality_score}/100)`);
    }
  }

  console.log('═'.repeat(40));
}

/**
 * SQL to create the blog_articles table in Supabase
 * Run this in the Supabase SQL editor to set up tracking
 */
export const CREATE_TABLE_SQL = `
-- Blog Articles Tracking Table
CREATE TABLE IF NOT EXISTS blog_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  silo_type TEXT NOT NULL CHECK (silo_type IN ('pillar', 'cluster', 'supporting')),
  quality_score INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published BOOLEAN NOT NULL DEFAULT false,
  source_inspiration TEXT,
  regeneration_attempts INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_blog_articles_category ON blog_articles(category);
CREATE INDEX IF NOT EXISTS idx_blog_articles_silo ON blog_articles(silo_type);
CREATE INDEX IF NOT EXISTS idx_blog_articles_generated ON blog_articles(generated_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_articles_updated_at ON blog_articles;
CREATE TRIGGER blog_articles_updated_at
  BEFORE UPDATE ON blog_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS Policies (optional - enable if using auth)
-- ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for service role" ON blog_articles FOR ALL USING (true);
`;

/**
 * Print setup instructions
 */
export function printSetupInstructions(): void {
  console.log('\n📋 SUPABASE TRACKING SETUP');
  console.log('═'.repeat(50));
  console.log('\n1. Go to your Supabase project SQL Editor');
  console.log('2. Run the following SQL to create the tracking table:\n');
  console.log(CREATE_TABLE_SQL);
  console.log('\n3. Set environment variables:');
  console.log('   SUPABASE_URL=https://your-project.supabase.co');
  console.log('   SUPABASE_SERVICE_KEY=your-service-role-key');
  console.log('\n4. Run blog generation and articles will be tracked automatically!');
  console.log('═'.repeat(50));
}
