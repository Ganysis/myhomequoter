/**
 * Automated Blog Generation Script with Research & Silo Integration
 *
 * This script automatically generates high-quality blog posts by:
 * 1. Loading researched topics from content-research.ts output
 * 2. Using silo structure (pillar → cluster → supporting)
 * 3. Smart selection based on SEO value and content gaps
 * 4. Proper internal linking within silos
 * 5. Generating 3 articles per run across categories
 *
 * Usage:
 *   npm run blog:auto                     # Generate 3 articles
 *   npm run blog:auto -- --count 5        # Generate 5 articles
 *   npm run blog:auto -- --from-research  # Use researched topics
 *   npm run blog:auto -- --dry-run        # Preview without saving
 *   npm run blog:auto -- --category solar # Focus on one category
 *   npm run blog:auto -- --silo pillar    # Only generate pillar content
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { scoreContent as scoreQuality, printQualityReport, QUALITY_THRESHOLD as GATE_THRESHOLD } from './lib/quality-gate.js';
import { trackArticle, getGeneratedSlugs, printArticleStats } from './lib/supabase-tracker.js';

const anthropic = new Anthropic();

// =============================================================================
// TYPES
// =============================================================================

interface TopicWithMeta {
  topic: string;
  title?: string; // From research
  intent: 'transactional' | 'commercial' | 'informational';
  priority: 1 | 2 | 3;
  searchVolume: 'high' | 'medium' | 'low';
  competition: 'high' | 'medium' | 'low';
  seasonality?: string;
  category: string;
  silo?: 'pillar' | 'cluster' | 'supporting';
  targetKeywords?: string[];
  relatedPillar?: string;
  contentAngle?: string;
  sourceInspiration?: string;
}

interface ResearchedTopic {
  title: string;
  category: string;
  silo: 'pillar' | 'cluster' | 'supporting';
  searchIntent: 'informational' | 'commercial' | 'transactional';
  estimatedVolume: 'high' | 'medium' | 'low';
  competition: 'high' | 'medium' | 'low';
  trendingScore: number;
  targetKeywords: string[];
  contentAngle: string;
  uniqueValue: string;
  sourceInspiration: string;
}

// Silo structure for internal linking
interface SiloConfig {
  pillarSlug: string;
  pillarTitle: string;
  clusterSlugs: string[];
}

interface BlogPostContent {
  title: string;
  description: string;
  author: string;
  readingTime: number;
  tags: string[];
  content: string;
}

interface GenerationResult {
  success: boolean;
  topic: string;
  category: string;
  slug?: string;
  error?: string;
  qualityScore?: number;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const DEFAULT_ARTICLES_PER_RUN = 5;
const QUALITY_THRESHOLD = 80;
const MAX_REGENERATION_ATTEMPTS = 2;

// Category priority weights (must sum to 100)
// Phase 1: Solar > Roofing > HVAC (most profitable leads)
const CATEGORY_WEIGHTS: Record<string, number> = {
  solar: 40,      // $50-150 per lead
  roofing: 35,    // $30-80 per lead
  hvac: 25,       // $25-60 per lead
  windows: 0,     // Phase 2
  plumbing: 0,    // Phase 2
  electrical: 0,  // Phase 2
};

const CATEGORY_NAMES: Record<string, string> = {
  solar: 'Solar Panels',
  roofing: 'Roofing',
  hvac: 'HVAC',
  windows: 'Windows & Doors',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
};

const IMAGE_KEYWORDS: Record<string, string[]> = {
  solar: ['solar panels roof', 'solar installation', 'solar energy home', 'residential solar', 'solar technician'],
  roofing: ['roof shingles', 'roofing contractor', 'new roof house', 'roof repair', 'roofing materials'],
  hvac: ['air conditioning unit', 'hvac technician', 'furnace installation', 'heat pump', 'home cooling'],
  windows: ['window installation', 'new windows house', 'window replacement', 'energy efficient windows', 'home windows'],
  plumbing: ['plumber working', 'water heater', 'plumbing repair', 'bathroom plumbing', 'pipe installation'],
  electrical: ['electrician working', 'electrical panel', 'home wiring', 'ev charger home', 'electrical installation'],
};

// Silo structure for proper internal linking
const SILO_CONFIG: Record<string, SiloConfig> = {
  solar: {
    pillarSlug: 'complete-guide-home-solar-panels',
    pillarTitle: 'Complete Guide to Home Solar Panels',
    clusterSlugs: ['solar-panel-cost', 'solar-installation', 'solar-tax-credit', 'solar-roi', 'solar-battery']
  },
  roofing: {
    pillarSlug: 'complete-roof-replacement-guide',
    pillarTitle: 'Complete Roof Replacement Guide',
    clusterSlugs: ['roof-replacement-cost', 'roofing-materials', 'roof-repair', 'roofing-contractor', 'roof-inspection']
  },
  hvac: {
    pillarSlug: 'complete-hvac-guide',
    pillarTitle: 'Complete HVAC Guide for Homeowners',
    clusterSlugs: ['hvac-system-cost', 'ac-replacement', 'furnace-replacement', 'heat-pump', 'hvac-maintenance']
  },
  windows: {
    pillarSlug: 'complete-window-replacement-guide',
    pillarTitle: 'Complete Window Replacement Guide',
    clusterSlugs: ['window-replacement-cost', 'window-types', 'window-brands', 'energy-efficient-windows', 'window-installation']
  },
  plumbing: {
    pillarSlug: 'complete-home-plumbing-guide',
    pillarTitle: 'Complete Home Plumbing Guide',
    clusterSlugs: ['plumber-cost', 'water-heater', 'pipe-repair', 'drain-cleaning', 'plumbing-emergency']
  },
  electrical: {
    pillarSlug: 'complete-home-electrical-guide',
    pillarTitle: 'Complete Home Electrical Guide',
    clusterSlugs: ['electrician-cost', 'electrical-panel-upgrade', 'ev-charger', 'electrical-safety', 'smart-home-wiring']
  }
};

// =============================================================================
// TOPIC DATABASE - SEO optimized topics with metadata
// =============================================================================

const ALL_TOPICS: TopicWithMeta[] = [
  // SOLAR
  { category: 'solar', topic: 'How Much Do Solar Panels Cost in 2024? Complete Pricing Guide', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
  { category: 'solar', topic: 'Solar Panel Installation Cost: What to Expect by State', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'medium' },
  { category: 'solar', topic: 'Is Solar Worth It? ROI Calculator and Payback Analysis', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'medium' },
  { category: 'solar', topic: 'Solar Panels vs Solar Shingles: Cost, Efficiency, and Pros/Cons', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'solar', topic: 'Best Solar Panel Brands 2024: SunPower vs LG vs Panasonic', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
  { category: 'solar', topic: 'Lease vs Buy Solar Panels: Which Option Saves More Money?', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'solar', topic: 'Federal Solar Tax Credit 2024: How to Claim Your 30% ITC', intent: 'informational', priority: 2, searchVolume: 'high', competition: 'medium' },
  { category: 'solar', topic: 'How Solar Net Metering Works: State-by-State Guide', intent: 'informational', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'solar', topic: 'Solar Battery Storage: Tesla Powerwall vs Alternatives Compared', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
  { category: 'solar', topic: 'Solar Panel Maintenance: Complete Care Guide for Homeowners', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
  { category: 'solar', topic: 'Common Solar Panel Problems and How to Fix Them', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
  { category: 'solar', topic: 'How Long Do Solar Panels Last? Lifespan and Degradation Facts', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },

  // ROOFING
  { category: 'roofing', topic: 'Roof Replacement Cost 2024: Price by Material and Size', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
  { category: 'roofing', topic: 'How Much Does a New Roof Cost? Complete Pricing Breakdown', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
  { category: 'roofing', topic: 'Metal Roof Cost vs Shingles: Which Is Worth the Investment?', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'medium' },
  { category: 'roofing', topic: 'Asphalt vs Metal Roofing: 10-Year Cost Comparison', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
  { category: 'roofing', topic: 'Best Roofing Materials 2024: Durability, Cost, and Climate Guide', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
  { category: 'roofing', topic: 'Architectural Shingles vs 3-Tab: Differences and Costs', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'roofing', topic: '10 Signs Your Roof Needs Replacement (Not Just Repair)', intent: 'informational', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'roofing', topic: 'Roof Leak Repair: DIY Fixes vs When to Call a Pro', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },
  { category: 'roofing', topic: 'Storm Damage Roof Inspection: What Insurance Covers', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },
  { category: 'roofing', topic: 'How Long Does a Roof Last? Lifespan by Material Type', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },
  { category: 'roofing', topic: "Roof Warranty Guide: What's Actually Covered?", intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
  { category: 'roofing', topic: 'How to Choose a Roofing Contractor: 15 Questions to Ask', intent: 'transactional', priority: 2, searchVolume: 'medium', competition: 'low' },

  // HVAC
  { category: 'hvac', topic: 'New HVAC System Cost 2024: AC, Furnace, and Heat Pump Prices', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
  { category: 'hvac', topic: 'How Much Does AC Replacement Cost? Pricing by Unit Size', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high', seasonality: 'summer' },
  { category: 'hvac', topic: 'Furnace Replacement Cost: Gas vs Electric Comparison', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'medium', seasonality: 'winter' },
  { category: 'hvac', topic: 'Heat Pump vs Central Air: Which Saves More Money?', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
  { category: 'hvac', topic: 'Mini Split vs Central Air: Cost and Efficiency Comparison', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'hvac', topic: 'Best HVAC Brands 2024: Carrier vs Trane vs Lennox', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
  { category: 'hvac', topic: 'Signs Your HVAC System Needs Replacement: 8 Red Flags', intent: 'informational', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'hvac', topic: 'AC Not Cooling? 10 Troubleshooting Steps Before Calling a Pro', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low', seasonality: 'summer' },
  { category: 'hvac', topic: 'Furnace Not Heating: Common Causes and Fixes', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low', seasonality: 'winter' },
  { category: 'hvac', topic: 'HVAC Maintenance Checklist: Seasonal Care Guide', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
  { category: 'hvac', topic: 'SEER Rating Explained: What It Means for Your Energy Bills', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
  { category: 'hvac', topic: 'How to Size an HVAC System: BTU Calculator Guide', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },

  // WINDOWS
  { category: 'windows', topic: 'Window Replacement Cost 2024: Prices by Type and Material', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
  { category: 'windows', topic: 'How Much Do New Windows Cost? Price Per Window Breakdown', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
  { category: 'windows', topic: 'Pella vs Andersen vs Marvin: Window Brand Comparison', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
  { category: 'windows', topic: 'Double Pane vs Triple Pane Windows: Is It Worth the Upgrade?', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'windows', topic: 'Vinyl vs Fiberglass vs Wood Windows: Complete Comparison', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'windows', topic: 'Replacement Windows vs New Construction: Which Do You Need?', intent: 'informational', priority: 2, searchVolume: 'low', competition: 'low' },
  { category: 'windows', topic: 'Signs You Need New Windows: 7 Warning Signals', intent: 'informational', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'windows', topic: 'Foggy Windows Between Panes: Causes and Solutions', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
  { category: 'windows', topic: 'Drafty Windows: Fix or Replace? Decision Guide', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
  { category: 'windows', topic: 'Window Energy Efficiency Ratings Explained: U-Factor and SHGC', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
  { category: 'windows', topic: 'Best Windows for Cold Climates vs Hot Climates', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
  { category: 'windows', topic: 'Window Installation: DIY vs Professional Cost Comparison', intent: 'commercial', priority: 3, searchVolume: 'low', competition: 'low' },

  // PLUMBING
  { category: 'plumbing', topic: 'Plumber Cost 2024: Average Rates and Service Prices', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
  { category: 'plumbing', topic: 'Water Heater Replacement Cost: Tank vs Tankless Prices', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'medium' },
  { category: 'plumbing', topic: 'Whole House Repiping Cost: PEX vs Copper Pricing', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'plumbing', topic: 'Tankless vs Tank Water Heater: 10-Year Cost Analysis', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
  { category: 'plumbing', topic: 'PEX vs Copper Pipes: Which Is Better for Your Home?', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'plumbing', topic: 'Best Water Heater Brands 2024: Rheem vs AO Smith vs Bradford', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'plumbing', topic: 'Signs of a Slab Leak: 8 Warning Signs and Detection Tips', intent: 'informational', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'plumbing', topic: 'Low Water Pressure: Causes and How to Fix It', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },
  { category: 'plumbing', topic: 'Drain Clog: DIY Solutions vs When to Call a Plumber', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },
  { category: 'plumbing', topic: 'How Long Do Water Heaters Last? Replacement Timeline', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
  { category: 'plumbing', topic: 'Plumbing Emergency: What to Do Before the Plumber Arrives', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
  { category: 'plumbing', topic: 'Water Softener vs Water Filter: Which Do You Need?', intent: 'commercial', priority: 3, searchVolume: 'low', competition: 'low' },

  // ELECTRICAL
  { category: 'electrical', topic: 'Electrician Cost 2024: Average Hourly Rates and Service Prices', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
  { category: 'electrical', topic: 'Electrical Panel Upgrade Cost: 100 to 200 Amp Pricing', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'medium' },
  { category: 'electrical', topic: 'EV Charger Installation Cost: Level 2 Home Charging Guide', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'medium' },
  { category: 'electrical', topic: 'GFCI vs AFCI Outlets: Where You Need Each Type', intent: 'informational', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'electrical', topic: 'Solar Panel Electrical Requirements: Panel Upgrade Guide', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'electrical', topic: 'Whole House Generator vs Portable: Cost and Sizing Guide', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
  { category: 'electrical', topic: 'Signs of Electrical Problems: 10 Warning Signs in Your Home', intent: 'informational', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'electrical', topic: 'Flickering Lights: Causes and When to Call an Electrician', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },
  { category: 'electrical', topic: 'Circuit Breaker Keeps Tripping: Causes and Solutions', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },
  { category: 'electrical', topic: 'How to Choose an Electrician: License, Insurance, Questions', intent: 'transactional', priority: 2, searchVolume: 'medium', competition: 'low' },
  { category: 'electrical', topic: 'Electrical Code Requirements 2024: What Homeowners Should Know', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
  { category: 'electrical', topic: 'Smart Home Electrical: Wiring Requirements and Costs', intent: 'commercial', priority: 3, searchVolume: 'low', competition: 'low' },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getExistingPosts(): Promise<string[]> {
  const blogDir = path.join(process.cwd(), 'src', 'content', 'blog');
  const fileSlugs: string[] = [];

  if (fs.existsSync(blogDir)) {
    fileSlugs.push(...fs.readdirSync(blogDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', '')));
  }

  // Also check Supabase for tracked articles
  const supabaseSlugs = await getGeneratedSlugs();

  // Merge and dedupe
  const allSlugs = new Set([...fileSlugs, ...supabaseSlugs]);
  return Array.from(allSlugs);
}

function topicToSlug(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getInternalLinks(category: string): string[] {
  const links: Record<string, string[]> = {
    solar: ['/get-quotes/solar/', '/solar/', '/blog/category/solar/'],
    roofing: ['/get-quotes/roofing/', '/roofing/', '/blog/category/roofing/'],
    hvac: ['/get-quotes/hvac/', '/hvac/', '/blog/category/hvac/'],
    windows: ['/get-quotes/windows/', '/windows/', '/blog/category/windows/'],
    plumbing: ['/get-quotes/plumbing/', '/plumbing/', '/blog/category/plumbing/'],
    electrical: ['/get-quotes/electrical/', '/electrical/', '/blog/category/electrical/'],
  };
  return links[category] || [];
}

/**
 * Get silo-based internal links for proper content clustering
 */
function getSiloLinks(category: string, siloType: 'pillar' | 'cluster' | 'supporting'): string[] {
  const silo = SILO_CONFIG[category];
  if (!silo) return getInternalLinks(category);

  const links: string[] = [
    `/get-quotes/${category}/`, // Always include CTA
  ];

  if (siloType === 'pillar') {
    // Pillar links to all clusters
    silo.clusterSlugs.forEach(slug => {
      links.push(`/blog/${slug}/`);
    });
  } else {
    // Cluster/supporting links back to pillar
    links.push(`/blog/${silo.pillarSlug}/`);
    // And to related clusters
    silo.clusterSlugs.slice(0, 2).forEach(slug => {
      links.push(`/blog/${slug}/`);
    });
  }

  return links;
}

/**
 * Load researched topics from content-research.ts output
 */
function loadResearchedTopics(): ResearchedTopic[] {
  const topicsFile = path.join(process.cwd(), 'scripts', 'research-data', 'latest-topics.json');

  if (!fs.existsSync(topicsFile)) {
    console.log('   No researched topics found. Run `npm run blog:research` first.');
    return [];
  }

  try {
    const content = fs.readFileSync(topicsFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('   Error loading researched topics:', error);
    return [];
  }
}

/**
 * Convert researched topic to TopicWithMeta format
 */
function convertResearchedTopic(topic: ResearchedTopic): TopicWithMeta {
  return {
    topic: topic.title,
    title: topic.title,
    intent: topic.searchIntent,
    priority: topic.silo === 'pillar' ? 1 : topic.silo === 'cluster' ? 2 : 3,
    searchVolume: topic.estimatedVolume,
    competition: topic.competition,
    category: topic.category,
    silo: topic.silo,
    targetKeywords: topic.targetKeywords,
    contentAngle: topic.contentAngle,
    sourceInspiration: topic.sourceInspiration,
  };
}

function generateImageConfig(category: string) {
  const keywords = IMAGE_KEYWORDS[category] || ['home improvement'];
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];
  return {
    heroImage: `https://source.unsplash.com/1200x630/?${encodeURIComponent(keyword)}`,
    thumbnailImage: `https://source.unsplash.com/400x300/?${encodeURIComponent(keyword)}`,
  };
}

// =============================================================================
// SMART TOPIC SELECTION
// =============================================================================

async function selectBestTopics(
  count: number,
  focusCategory?: string,
  options: { useResearch?: boolean; siloType?: 'pillar' | 'cluster' | 'supporting' } = {}
): Promise<TopicWithMeta[]> {
  const existingPosts = await getExistingPosts();
  let availableTopics: TopicWithMeta[] = [];

  // Load from research if available and requested
  if (options.useResearch) {
    const researchedTopics = loadResearchedTopics();
    if (researchedTopics.length > 0) {
      console.log(`   📚 Loaded ${researchedTopics.length} researched topics`);
      availableTopics = researchedTopics.map(convertResearchedTopic);
    }
  }

  // Fall back to predefined topics if no research or as supplement
  if (availableTopics.length === 0) {
    availableTopics = ALL_TOPICS;
  }

  // Filter out already generated topics
  availableTopics = availableTopics.filter(t => {
    const slug = topicToSlug(t.topic);
    return !existingPosts.includes(slug);
  });

  // Optionally filter by category
  if (focusCategory) {
    availableTopics = availableTopics.filter(t => t.category === focusCategory);
  }

  // Optionally filter by silo type
  if (options.siloType) {
    availableTopics = availableTopics.filter(t => t.silo === options.siloType);
  }

  if (availableTopics.length === 0) {
    console.log('All predefined topics have been generated!');
    return [];
  }

  // Score each topic
  const scoredTopics = availableTopics.map(t => {
    let score = 0;

    // Priority (1=100pts, 2=70pts, 3=40pts)
    score += (4 - t.priority) * 30;

    // Silo importance (pillar content first)
    if (t.silo === 'pillar') score += 25;
    else if (t.silo === 'cluster') score += 15;

    // Search volume
    score += t.searchVolume === 'high' ? 30 : t.searchVolume === 'medium' ? 20 : 10;

    // Competition (prefer low)
    score += t.competition === 'low' ? 25 : t.competition === 'medium' ? 15 : 5;

    // Intent bonus (commercial > transactional > informational for lead gen)
    score += t.intent === 'commercial' ? 15 : t.intent === 'transactional' ? 20 : 10;

    return { ...t, score };
  });

  // Sort by score
  scoredTopics.sort((a, b) => b.score - a.score);

  // Select topics based on category weights (Solar 40%, Roofing 35%, HVAC 25%)
  const selected: TopicWithMeta[] = [];

  // Calculate how many articles per category based on weights
  const categoryAllocation: Record<string, number> = {};
  const activeCategories = Object.entries(CATEGORY_WEIGHTS)
    .filter(([, weight]) => weight > 0);

  for (const [cat, weight] of activeCategories) {
    categoryAllocation[cat] = Math.round((weight / 100) * count);
  }

  // Ensure we hit the target count (adjust for rounding)
  const totalAllocated = Object.values(categoryAllocation).reduce((a, b) => a + b, 0);
  if (totalAllocated < count) {
    // Add extra to highest weight category
    const topCat = activeCategories.sort((a, b) => b[1] - a[1])[0][0];
    categoryAllocation[topCat] += count - totalAllocated;
  }

  console.log(`   📊 Category allocation: ${JSON.stringify(categoryAllocation)}`);

  // Select topics by category allocation
  const categoryCount: Record<string, number> = {};

  for (const topic of scoredTopics) {
    if (selected.length >= count) break;

    const cat = topic.category;
    const allocated = categoryAllocation[cat] || 0;
    const used = categoryCount[cat] || 0;

    if (used < allocated) {
      selected.push(topic);
      categoryCount[cat] = used + 1;
    }
  }

  // Fill remaining slots with best remaining topics
  for (const topic of scoredTopics) {
    if (selected.length >= count) break;
    if (!selected.includes(topic)) {
      selected.push(topic);
    }
  }

  return selected;
}

// =============================================================================
// CONTENT GENERATION
// =============================================================================

const BLOG_SYSTEM_PROMPT = `You are a senior SEO content strategist with 15+ years of experience ranking home services content on Google. You've worked with major home improvement brands and understand what makes content rank AND convert.

Your expertise includes:
- Deep understanding of Google's E-E-A-T quality guidelines
- Featured snippet optimization techniques
- User intent matching and search journey mapping
- Conversion copywriting for lead generation
- Home improvement industry expertise (costs, processes, regulations)

CRITICAL RULES:
1. Write like a trusted expert, not a marketer
2. Include SPECIFIC data points (exact costs, timelines, percentages)
3. Address common objections and concerns head-on
4. Use the inverted pyramid - most important info first
5. Every section must provide unique value (no filler)
6. Include actionable takeaways readers can implement immediately

Your output must be valid JSON matching the specified schema.`;

async function generateBlogPost(topic: TopicWithMeta): Promise<BlogPostContent> {
  const categoryName = CATEGORY_NAMES[topic.category] || topic.category;
  const siloType = topic.silo || 'supporting';
  const internalLinks = getSiloLinks(topic.category, siloType);
  const siloConfig = SILO_CONFIG[topic.category];

  // Build silo context for the prompt
  let siloContext = '';
  if (siloConfig) {
    if (siloType === 'pillar') {
      siloContext = `
SILO ROLE: This is a PILLAR article - the cornerstone content for ${categoryName}.
- Be comprehensive and authoritative (2500-3500 words)
- Cover the topic broadly, linking to cluster articles for depth
- This should be THE definitive guide that ranks for head terms
- Link to these cluster topics: ${siloConfig.clusterSlugs.map(s => `/blog/${s}/`).join(', ')}`;
    } else if (siloType === 'cluster') {
      siloContext = `
SILO ROLE: This is a CLUSTER article supporting the pillar content.
- Focus deeply on this specific sub-topic (2000-2800 words)
- Link back to pillar: /blog/${siloConfig.pillarSlug}/ ("${siloConfig.pillarTitle}")
- Link to related clusters for topic depth`;
    } else {
      siloContext = `
SILO ROLE: This is a SUPPORTING article in the ${categoryName} silo.
- Provide detailed, specific information on a narrow topic
- Link back to pillar content: /blog/${siloConfig.pillarSlug}/`;
    }
  }

  const prompt = `Create an expert-level blog post that will RANK on Google and CONVERT readers.

TOPIC: "${topic.topic}"
CATEGORY: ${categoryName}
PRIMARY KEYWORDS: ${topic.targetKeywords?.join(', ') || topic.topic.toLowerCase().split(' ').slice(0, 5).join(', ')}
SEARCH INTENT: ${topic.intent.toUpperCase()}
${siloContext}
${topic.contentAngle ? `CONTENT ANGLE: ${topic.contentAngle}` : ''}
${topic.sourceInspiration ? `INSPIRATION: Trending on ${topic.sourceInspiration}` : ''}

=== OUTPUT FORMAT (JSON) ===
{
  "title": "SEO title following pattern: [Primary Keyword] + [Modifier] + [Year/Number]",
  "description": "Meta description (150-160 chars) with: keyword, benefit, CTA",
  "author": "MyHomeQuoter Team",
  "readingTime": <calculated based on ~200 words/min>,
  "tags": ["primary keyword", "long-tail 1", "long-tail 2", "related topic"],
  "content": "<FULL MARKDOWN ARTICLE>"
}

=== CONTENT STRUCTURE ===

**OPENING**
- Hook + answer the main question immediately (featured snippet optimization)
- Quick summary box for skimmers
- State expertise context

**REQUIRED SECTIONS:**
1. ## Overview/Introduction - Define topic, why it matters
2. ## Cost/Price Section (if applicable) - SPECIFIC ranges with table
3. ## How-To / Process - Numbered steps with details
4. ## Signs/When to Know - Bullet list of indicators
5. ## Comparison/Options - Table comparing alternatives
6. ## Expert Tips / Pro Advice - Insider knowledge, money-saving
7. ## FAQs (5-7 questions) - Target "People Also Ask"
8. ## Final Thoughts + CTA - Link to: ${internalLinks[0] || '/get-quotes/' + topic.category + '/'}

=== REQUIREMENTS ===
- Word count: ${topic.priority === 1 ? '2500-3500' : '2000-2800'} words
- Include at least 2 data tables
- Use **bold** for key terms and numbers
- Add > blockquote for "Pro Tip" callouts
- Natural internal linking to: ${internalLinks.join(', ')}
- American English, conversational but professional

Return ONLY valid JSON, no markdown code blocks around it.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: BLOG_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in response');
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse JSON from response');
  }
}

function createBlogPostMarkdown(content: BlogPostContent, topic: TopicWithMeta): string {
  const today = new Date().toISOString().split('T')[0];
  const imageConfig = generateImageConfig(topic.category);

  const frontmatter = `---
title: "${content.title.replace(/"/g, '\\"')}"
description: "${content.description.replace(/"/g, '\\"')}"
publishDate: ${today}
author: "${content.author}"
category: ${topic.category}
tags: ${JSON.stringify(content.tags)}
image:
  src: "${imageConfig.heroImage}"
  alt: "${content.title.replace(/"/g, '\\"')}"
featured: ${topic.priority === 1}
readingTime: ${content.readingTime}
---

`;

  return frontmatter + content.content;
}

async function saveBlogPost(slug: string, markdown: string): Promise<void> {
  const dir = path.join(process.cwd(), 'src', 'content', 'blog');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, `${slug}.md`);
  fs.writeFileSync(filePath, markdown);
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  const getArg = (name: string): string | undefined => {
    const index = args.indexOf(`--${name}`);
    return index > -1 ? args[index + 1] : undefined;
  };

  const dryRun = args.includes('--dry-run');
  const useResearch = args.includes('--from-research');
  const count = parseInt(getArg('count') || String(DEFAULT_ARTICLES_PER_RUN), 10);
  const focusCategory = getArg('category');
  const siloType = getArg('silo') as 'pillar' | 'cluster' | 'supporting' | undefined;

  console.log('\n🤖 AUTOMATED BLOG GENERATION (with Silo Structure)');
  console.log('═'.repeat(50));
  console.log(`📅 Date: ${new Date().toISOString().split('T')[0]}`);
  console.log(`📝 Target articles: ${count}`);
  console.log(`🎯 Focus category: ${focusCategory || 'All categories'}`);
  console.log(`🏗️ Silo type: ${siloType || 'All types'}`);
  console.log(`📚 Use research: ${useResearch ? 'Yes' : 'No (using predefined topics)'}`);
  console.log(`🔧 Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE (will save files)'}`);
  console.log('═'.repeat(50));

  // Select best topics (check existing in files + Supabase)
  console.log('   Checking existing articles...');
  const selectedTopics = await selectBestTopics(count, focusCategory, { useResearch, siloType });

  if (selectedTopics.length === 0) {
    console.log('\n⚠️ No topics available for generation.');
    console.log('All predefined topics have been generated.');
    return;
  }

  console.log('\n📋 SELECTED TOPICS:');
  selectedTopics.forEach((t, i) => {
    const intentIcon = t.intent === 'commercial' ? '🔍' : t.intent === 'transactional' ? '💰' : '📚';
    const siloIcon = t.silo === 'pillar' ? '🏛️' : t.silo === 'cluster' ? '🔗' : '📄';
    const priorityStars = '⭐'.repeat(4 - t.priority);
    console.log(`\n  ${i + 1}. ${siloIcon} ${intentIcon} ${t.topic}`);
    console.log(`     Category: ${CATEGORY_NAMES[t.category]} | Silo: ${t.silo || 'supporting'} | Priority: ${priorityStars}`);
    console.log(`     Volume: ${t.searchVolume} | Competition: ${t.competition}`);
    if (t.sourceInspiration) console.log(`     Source: ${t.sourceInspiration}`);
  });

  const results: GenerationResult[] = [];

  console.log('\n🚀 GENERATING CONTENT...\n');

  for (let i = 0; i < selectedTopics.length; i++) {
    const topic = selectedTopics[i];
    const slug = topicToSlug(topic.topic);

    console.log(`[${i + 1}/${selectedTopics.length}] Generating: "${topic.topic}"...`);

    let attempts = 0;
    let finalContent: BlogPostContent | null = null;
    let finalScore = 0;
    let finalMarkdown = '';

    // Regeneration loop - up to MAX_REGENERATION_ATTEMPTS if quality < threshold
    while (attempts < MAX_REGENERATION_ATTEMPTS) {
      attempts++;

      try {
        console.log(`   Attempt ${attempts}/${MAX_REGENERATION_ATTEMPTS}...`);
        const content = await generateBlogPost(topic);
        const markdown = createBlogPostMarkdown(content, topic);

        // Use comprehensive quality gate
        const qualityResult = scoreQuality(markdown, topic.category);

        console.log(`   ✅ Generated (Quality: ${qualityResult.overall}/100)`);

        if (qualityResult.overall >= QUALITY_THRESHOLD) {
          finalContent = content;
          finalScore = qualityResult.overall;
          finalMarkdown = markdown;
          console.log(`   ✓ Passed quality gate (${qualityResult.overall} >= ${QUALITY_THRESHOLD})`);
          break;
        } else {
          console.log(`   ⚠️ Quality ${qualityResult.overall} < ${QUALITY_THRESHOLD} threshold`);
          if (qualityResult.issues.length > 0) {
            console.log(`   Issues: ${qualityResult.issues.slice(0, 2).join(', ')}`);
          }

          // Keep best attempt
          if (qualityResult.overall > finalScore) {
            finalContent = content;
            finalScore = qualityResult.overall;
            finalMarkdown = markdown;
          }

          if (attempts < MAX_REGENERATION_ATTEMPTS) {
            console.log(`   🔄 Regenerating...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } catch (error) {
        console.log(`   ❌ Attempt ${attempts} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (attempts >= MAX_REGENERATION_ATTEMPTS) {
          results.push({
            success: false,
            topic: topic.topic,
            category: topic.category,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Save best result if we have content
    if (finalContent) {
      console.log(`   📄 Title: ${finalContent.title}`);
      console.log(`   📖 Reading time: ${finalContent.readingTime} min`);

      if (dryRun) {
        console.log(`   🔍 DRY RUN - Not saving`);
        console.log(`   Preview:\n${finalMarkdown.slice(0, 500)}...\n`);
      } else {
        if (finalScore < QUALITY_THRESHOLD) {
          console.log(`   ⚠️ Best score ${finalScore} still below threshold. Saving anyway.`);
        }
        await saveBlogPost(slug, finalMarkdown);
        console.log(`   💾 Saved: src/content/blog/${slug}.md`);

        // Track in Supabase
        const wordCount = finalMarkdown.split(/\s+/).filter(w => w.length > 0).length;
        await trackArticle({
          slug,
          title: finalContent.title,
          category: topic.category,
          silo_type: topic.silo || 'supporting',
          quality_score: finalScore,
          word_count: wordCount,
          generated_at: new Date().toISOString(),
          published: true,
          source_inspiration: topic.sourceInspiration,
          regeneration_attempts: attempts,
        });
      }

      results.push({
        success: true,
        topic: topic.topic,
        category: topic.category,
        slug,
        qualityScore: finalScore,
      });
    }

    // Delay between topics
    if (i < selectedTopics.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Summary
  console.log('\n═'.repeat(50));
  console.log('📊 GENERATION SUMMARY');
  console.log('═'.repeat(50));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (successful.length > 0) {
    console.log('\nGenerated articles:');
    successful.forEach(r => {
      console.log(`  - ${r.slug} (${r.category}, score: ${r.qualityScore}/100)`);
    });
  }

  if (failed.length > 0) {
    console.log('\nFailed articles:');
    failed.forEach(r => {
      console.log(`  - ${r.topic}: ${r.error}`);
    });
  }

  // Show overall stats from Supabase
  if (!dryRun && successful.length > 0) {
    await printArticleStats();
  }

  console.log('\n✅ Auto-generation complete!\n');
}

main().catch(console.error);
