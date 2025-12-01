/**
 * Content Research & Trend Analysis System
 *
 * Scans top US construction and home improvement sites to:
 * 1. Discover trending topics and content gaps
 * 2. Analyze competitor content strategies
 * 3. Generate SEO-optimized topic ideas
 * 4. Feed into silo-based content structure
 *
 * Usage:
 *   npm run blog:research                    # Full research scan
 *   npm run blog:research -- --category solar # Focus on one category
 *   npm run blog:research -- --output json   # Export as JSON
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const anthropic = new Anthropic();

// =============================================================================
// TYPES
// =============================================================================

interface ResearchSource {
  name: string;
  url: string;
  type: 'competitor' | 'editorial' | 'trade' | 'government' | 'trends';
  categories: string[];
  description: string;
}

interface TopicIdea {
  title: string;
  category: string;
  silo: 'pillar' | 'cluster' | 'supporting';
  searchIntent: 'informational' | 'commercial' | 'transactional';
  estimatedVolume: 'high' | 'medium' | 'low';
  competition: 'high' | 'medium' | 'low';
  trendingScore: number; // 1-10
  sourceInspiration: string;
  targetKeywords: string[];
  relatedPillar?: string; // For cluster content, links to pillar
  contentAngle: string;
  uniqueValue: string;
}

interface SiloStructure {
  category: string;
  pillar: {
    topic: string;
    targetKeyword: string;
    clusters: string[];
  };
  clusters: {
    topic: string;
    supportingTopics: string[];
  }[];
}

interface ResearchReport {
  generatedAt: string;
  category?: string;
  sourcesAnalyzed: string[];
  topicIdeas: TopicIdea[];
  siloRecommendations: SiloStructure[];
  trendingThemes: string[];
  contentGaps: string[];
}

// =============================================================================
// AUTHORITATIVE SOURCES TO ANALYZE
// =============================================================================

const RESEARCH_SOURCES: ResearchSource[] = [
  // Lead Generation Competitors
  {
    name: 'HomeAdvisor',
    url: 'https://www.homeadvisor.com/cost/',
    type: 'competitor',
    categories: ['solar', 'roofing', 'hvac', 'windows', 'plumbing', 'electrical'],
    description: 'Major home services marketplace - cost guides and how-to content'
  },
  {
    name: 'Angi (Angies List)',
    url: 'https://www.angi.com/articles/',
    type: 'competitor',
    categories: ['solar', 'roofing', 'hvac', 'windows', 'plumbing', 'electrical'],
    description: 'Home services reviews and guides'
  },
  {
    name: 'Thumbtack',
    url: 'https://www.thumbtack.com/blog/',
    type: 'competitor',
    categories: ['solar', 'roofing', 'hvac', 'windows', 'plumbing', 'electrical'],
    description: 'Service marketplace with cost guides'
  },
  {
    name: 'Fixr',
    url: 'https://www.fixr.com/costs/',
    type: 'competitor',
    categories: ['solar', 'roofing', 'hvac', 'windows', 'plumbing', 'electrical'],
    description: 'Detailed cost estimation guides'
  },

  // Editorial/Authority Sites
  {
    name: 'This Old House',
    url: 'https://www.thisoldhouse.com/',
    type: 'editorial',
    categories: ['roofing', 'hvac', 'windows', 'plumbing', 'electrical'],
    description: 'Trusted home improvement authority since 1979'
  },
  {
    name: 'Bob Vila',
    url: 'https://www.bobvila.com/',
    type: 'editorial',
    categories: ['solar', 'roofing', 'hvac', 'windows', 'plumbing', 'electrical'],
    description: 'Expert home improvement advice'
  },
  {
    name: 'Family Handyman',
    url: 'https://www.familyhandyman.com/',
    type: 'editorial',
    categories: ['roofing', 'hvac', 'plumbing', 'electrical'],
    description: 'DIY and professional home improvement'
  },

  // Solar Specific
  {
    name: 'EnergySage',
    url: 'https://www.energysage.com/solar/',
    type: 'competitor',
    categories: ['solar'],
    description: 'Solar marketplace and education platform'
  },
  {
    name: 'Solar Reviews',
    url: 'https://www.solarreviews.com/',
    type: 'competitor',
    categories: ['solar'],
    description: 'Solar company reviews and guides'
  },
  {
    name: 'Energy.gov Solar',
    url: 'https://www.energy.gov/eere/solar/homeowners-guide-going-solar',
    type: 'government',
    categories: ['solar'],
    description: 'Official government solar resources'
  },

  // Trade Publications
  {
    name: 'Roofing Contractor',
    url: 'https://www.roofingcontractor.com/',
    type: 'trade',
    categories: ['roofing'],
    description: 'Industry news and trends for roofing professionals'
  },
  {
    name: 'ACHR News (HVAC)',
    url: 'https://www.achrnews.com/',
    type: 'trade',
    categories: ['hvac'],
    description: 'HVAC industry news and technology'
  },
  {
    name: 'Electrical Contractor',
    url: 'https://www.ecmag.com/',
    type: 'trade',
    categories: ['electrical'],
    description: 'Electrical industry publications'
  },

  // Trends & Research
  {
    name: 'Google Trends - Home Improvement',
    url: 'https://trends.google.com/trends/explore?cat=11',
    type: 'trends',
    categories: ['solar', 'roofing', 'hvac', 'windows', 'plumbing', 'electrical'],
    description: 'Search trend data for home improvement'
  },
  {
    name: 'Houzz',
    url: 'https://www.houzz.com/',
    type: 'editorial',
    categories: ['windows', 'roofing'],
    description: 'Home design and renovation trends'
  }
];

// =============================================================================
// SILO STRUCTURE TEMPLATES
// =============================================================================

const SILO_TEMPLATES: Record<string, SiloStructure> = {
  solar: {
    category: 'solar',
    pillar: {
      topic: 'Complete Guide to Home Solar Panels: Everything You Need to Know',
      targetKeyword: 'home solar panels guide',
      clusters: [
        'solar-cost',
        'solar-installation',
        'solar-savings',
        'solar-equipment',
        'solar-financing'
      ]
    },
    clusters: [
      {
        topic: 'Solar Panel Costs & Pricing',
        supportingTopics: [
          'cost by state',
          'cost per watt',
          'installation labor costs',
          'hidden costs',
          'price trends'
        ]
      },
      {
        topic: 'Solar Installation Process',
        supportingTopics: [
          'how installation works',
          'timeline expectations',
          'permits required',
          'roof preparation',
          'choosing an installer'
        ]
      },
      {
        topic: 'Solar Savings & ROI',
        supportingTopics: [
          'payback period',
          'electricity savings',
          'home value increase',
          'tax credits',
          'net metering'
        ]
      },
      {
        topic: 'Solar Equipment & Technology',
        supportingTopics: [
          'panel types',
          'inverters explained',
          'battery storage',
          'brand comparisons',
          'efficiency ratings'
        ]
      },
      {
        topic: 'Solar Financing Options',
        supportingTopics: [
          'buy vs lease',
          'solar loans',
          'PPA agreements',
          'incentives by state',
          'federal tax credit'
        ]
      }
    ]
  },
  roofing: {
    category: 'roofing',
    pillar: {
      topic: 'Complete Roof Replacement Guide: Costs, Materials & What to Expect',
      targetKeyword: 'roof replacement guide',
      clusters: [
        'roofing-costs',
        'roofing-materials',
        'roofing-problems',
        'roofing-contractors',
        'roofing-maintenance'
      ]
    },
    clusters: [
      {
        topic: 'Roofing Costs & Pricing',
        supportingTopics: [
          'cost by material',
          'cost by roof size',
          'labor costs',
          'repair vs replace costs',
          'insurance coverage'
        ]
      },
      {
        topic: 'Roofing Materials Compared',
        supportingTopics: [
          'asphalt shingles',
          'metal roofing',
          'tile roofing',
          'flat roofing',
          'material lifespan'
        ]
      },
      {
        topic: 'Roof Problems & Solutions',
        supportingTopics: [
          'leak detection',
          'storm damage',
          'age-related issues',
          'ventilation problems',
          'when to replace'
        ]
      },
      {
        topic: 'Hiring Roofing Contractors',
        supportingTopics: [
          'questions to ask',
          'red flags',
          'getting quotes',
          'contracts explained',
          'warranty types'
        ]
      },
      {
        topic: 'Roof Maintenance',
        supportingTopics: [
          'seasonal maintenance',
          'gutter care',
          'inspection checklist',
          'extending lifespan',
          'DIY vs professional'
        ]
      }
    ]
  },
  hvac: {
    category: 'hvac',
    pillar: {
      topic: 'Complete HVAC Guide: Heating, Cooling & Air Quality for Your Home',
      targetKeyword: 'home hvac guide',
      clusters: [
        'hvac-costs',
        'hvac-systems',
        'hvac-problems',
        'hvac-efficiency',
        'hvac-maintenance'
      ]
    },
    clusters: [
      {
        topic: 'HVAC Costs & Pricing',
        supportingTopics: [
          'AC replacement cost',
          'furnace replacement cost',
          'heat pump costs',
          'repair costs',
          'energy costs'
        ]
      },
      {
        topic: 'HVAC System Types',
        supportingTopics: [
          'central air',
          'heat pumps',
          'mini splits',
          'furnace types',
          'hybrid systems'
        ]
      },
      {
        topic: 'HVAC Problems & Fixes',
        supportingTopics: [
          'not cooling',
          'not heating',
          'strange noises',
          'poor airflow',
          'when to replace'
        ]
      },
      {
        topic: 'HVAC Efficiency',
        supportingTopics: [
          'SEER ratings',
          'energy star',
          'sizing guide',
          'zoning systems',
          'smart thermostats'
        ]
      },
      {
        topic: 'HVAC Maintenance',
        supportingTopics: [
          'filter changes',
          'seasonal tune-ups',
          'duct cleaning',
          'refrigerant checks',
          'preventive care'
        ]
      }
    ]
  },
  windows: {
    category: 'windows',
    pillar: {
      topic: 'Complete Window Replacement Guide: Types, Costs & Energy Savings',
      targetKeyword: 'window replacement guide',
      clusters: [
        'window-costs',
        'window-types',
        'window-problems',
        'window-efficiency',
        'window-installation'
      ]
    },
    clusters: [
      {
        topic: 'Window Replacement Costs',
        supportingTopics: [
          'cost per window',
          'cost by material',
          'labor costs',
          'full home cost',
          'ROI analysis'
        ]
      },
      {
        topic: 'Window Types & Materials',
        supportingTopics: [
          'vinyl windows',
          'wood windows',
          'fiberglass windows',
          'double vs triple pane',
          'window styles'
        ]
      },
      {
        topic: 'Window Problems',
        supportingTopics: [
          'foggy windows',
          'drafty windows',
          'condensation',
          'seal failure',
          'when to replace'
        ]
      },
      {
        topic: 'Window Energy Efficiency',
        supportingTopics: [
          'U-factor explained',
          'SHGC explained',
          'energy star windows',
          'climate considerations',
          'savings calculation'
        ]
      },
      {
        topic: 'Window Installation',
        supportingTopics: [
          'installation process',
          'timeline',
          'DIY vs professional',
          'permits needed',
          'choosing installer'
        ]
      }
    ]
  },
  plumbing: {
    category: 'plumbing',
    pillar: {
      topic: 'Complete Home Plumbing Guide: Systems, Repairs & When to Call a Pro',
      targetKeyword: 'home plumbing guide',
      clusters: [
        'plumbing-costs',
        'water-heaters',
        'plumbing-problems',
        'plumbing-upgrades',
        'plumbing-maintenance'
      ]
    },
    clusters: [
      {
        topic: 'Plumbing Costs',
        supportingTopics: [
          'plumber rates',
          'common repair costs',
          'repiping costs',
          'emergency costs',
          'inspection costs'
        ]
      },
      {
        topic: 'Water Heaters',
        supportingTopics: [
          'tank vs tankless',
          'gas vs electric',
          'sizing guide',
          'brands compared',
          'installation cost'
        ]
      },
      {
        topic: 'Plumbing Problems',
        supportingTopics: [
          'clogged drains',
          'leaky pipes',
          'low pressure',
          'slab leaks',
          'sewer line issues'
        ]
      },
      {
        topic: 'Plumbing Upgrades',
        supportingTopics: [
          'water softeners',
          'water filtration',
          'pipe materials',
          'fixture upgrades',
          'smart plumbing'
        ]
      },
      {
        topic: 'Plumbing Maintenance',
        supportingTopics: [
          'preventive care',
          'seasonal prep',
          'DIY maintenance',
          'inspection schedule',
          'emergency prep'
        ]
      }
    ]
  },
  electrical: {
    category: 'electrical',
    pillar: {
      topic: 'Complete Home Electrical Guide: Safety, Upgrades & Modern Systems',
      targetKeyword: 'home electrical guide',
      clusters: [
        'electrical-costs',
        'electrical-upgrades',
        'electrical-safety',
        'electrical-problems',
        'smart-home'
      ]
    },
    clusters: [
      {
        topic: 'Electrical Costs',
        supportingTopics: [
          'electrician rates',
          'panel upgrade cost',
          'rewiring cost',
          'outlet installation',
          'EV charger cost'
        ]
      },
      {
        topic: 'Electrical Upgrades',
        supportingTopics: [
          'panel upgrades',
          'EV charger installation',
          'generator installation',
          'outlet upgrades',
          'lighting upgrades'
        ]
      },
      {
        topic: 'Electrical Safety',
        supportingTopics: [
          'GFCI outlets',
          'AFCI protection',
          'grounding',
          'code requirements',
          'inspection checklist'
        ]
      },
      {
        topic: 'Electrical Problems',
        supportingTopics: [
          'circuit breaker trips',
          'flickering lights',
          'outlet issues',
          'wiring problems',
          'when to call pro'
        ]
      },
      {
        topic: 'Smart Home Electrical',
        supportingTopics: [
          'smart switches',
          'home automation',
          'wiring requirements',
          'hub systems',
          'voice control'
        ]
      }
    ]
  }
};

// =============================================================================
// RESEARCH FUNCTIONS
// =============================================================================

const RESEARCH_SYSTEM_PROMPT = `You are an expert SEO content strategist specializing in US home improvement and construction content. Your job is to analyze competitor content and industry trends to identify high-value content opportunities.

You understand:
- Google's E-E-A-T guidelines for YMYL (Your Money Your Life) content
- Search intent optimization
- Content gap analysis
- Silo/topic cluster SEO strategies
- US homeowner pain points and decision journeys

When analyzing sources, focus on:
1. Topics that get high engagement/rankings
2. Content gaps competitors haven't covered well
3. Trending topics and seasonal opportunities
4. Questions homeowners frequently ask
5. Commercial intent keywords (buying signals)`;

async function analyzeSourceForTopics(
  source: ResearchSource,
  category: string,
  existingTopics: string[]
): Promise<TopicIdea[]> {
  const prompt = `Analyze this authoritative home improvement source and generate content topic ideas:

SOURCE: ${source.name}
URL: ${source.url}
TYPE: ${source.type}
DESCRIPTION: ${source.description}
TARGET CATEGORY: ${category}

EXISTING TOPICS TO AVOID (we already have these):
${existingTopics.slice(0, 10).join('\n')}

Based on your knowledge of ${source.name} and similar authoritative sources in the US home improvement space, generate 5 unique, high-value content topic ideas for the "${category}" category.

For each topic, consider:
- What questions do homeowners search for?
- What content gaps exist in the market?
- What's trending in 2024-2025?
- What has commercial intent (leads to getting quotes)?

Return as JSON array:
[
  {
    "title": "SEO-optimized article title",
    "silo": "pillar" | "cluster" | "supporting",
    "searchIntent": "informational" | "commercial" | "transactional",
    "estimatedVolume": "high" | "medium" | "low",
    "competition": "high" | "medium" | "low",
    "trendingScore": 1-10,
    "targetKeywords": ["primary keyword", "secondary keyword"],
    "contentAngle": "What makes this article unique",
    "uniqueValue": "Why readers would choose this over competitors"
  }
]

Return ONLY valid JSON array.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: RESEARCH_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return [];
    }

    const ideas = JSON.parse(textContent.text);
    return ideas.map((idea: Partial<TopicIdea>) => ({
      ...idea,
      category,
      sourceInspiration: source.name,
    }));
  } catch (error) {
    console.error(`Error analyzing ${source.name}:`, error);
    return [];
  }
}

async function generateTrendingTopics(category: string): Promise<TopicIdea[]> {
  const categoryName = {
    solar: 'Solar Panels & Renewable Energy',
    roofing: 'Roofing & Roof Replacement',
    hvac: 'HVAC, Heating & Cooling',
    windows: 'Windows & Doors',
    plumbing: 'Plumbing & Water Systems',
    electrical: 'Electrical & Smart Home',
  }[category] || category;

  const prompt = `Generate 5 trending content topics for "${categoryName}" in the US home improvement market for 2024-2025.

Consider:
- New technologies and products
- Policy changes (tax credits, regulations)
- Seasonal trends
- Economic factors affecting homeowners
- Sustainability and energy efficiency trends
- Smart home integration

Return as JSON array with format:
[
  {
    "title": "Trending topic title optimized for SEO",
    "silo": "pillar" | "cluster" | "supporting",
    "searchIntent": "informational" | "commercial" | "transactional",
    "estimatedVolume": "high" | "medium" | "low",
    "competition": "low" | "medium" | "high",
    "trendingScore": 8-10,
    "targetKeywords": ["keyword1", "keyword2"],
    "contentAngle": "Why this is trending now",
    "uniqueValue": "Timely, relevant information homeowners need"
  }
]

Return ONLY valid JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: RESEARCH_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return [];
    }

    const ideas = JSON.parse(textContent.text);
    return ideas.map((idea: Partial<TopicIdea>) => ({
      ...idea,
      category,
      sourceInspiration: 'Trend Analysis',
    }));
  } catch (error) {
    console.error('Error generating trending topics:', error);
    return [];
  }
}

async function identifyContentGaps(
  category: string,
  existingTopics: string[]
): Promise<string[]> {
  const prompt = `Analyze content gaps for "${category}" in the US home improvement market.

EXISTING CONTENT:
${existingTopics.join('\n')}

Identify 5 major content gaps - topics that:
1. Homeowners frequently search for
2. Are not well covered by our existing content
3. Have commercial intent (lead to hiring contractors)
4. Can establish authority in this niche

Return as JSON array of strings describing each gap:
["Gap 1 description", "Gap 2 description", ...]

Return ONLY valid JSON array.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: RESEARCH_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return [];
    }

    return JSON.parse(textContent.text);
  } catch (error) {
    console.error('Error identifying content gaps:', error);
    return [];
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getExistingTopics(): string[] {
  const blogDir = path.join(process.cwd(), 'src', 'content', 'blog');
  if (!fs.existsSync(blogDir)) return [];

  return fs.readdirSync(blogDir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', '').replace(/-/g, ' '));
}

function prioritizeTopics(topics: TopicIdea[]): TopicIdea[] {
  return topics.sort((a, b) => {
    // Score each topic
    const scoreA = calculateTopicScore(a);
    const scoreB = calculateTopicScore(b);
    return scoreB - scoreA;
  });
}

function calculateTopicScore(topic: TopicIdea): number {
  let score = 0;

  // Silo importance
  score += topic.silo === 'pillar' ? 30 : topic.silo === 'cluster' ? 20 : 10;

  // Search volume
  score += topic.estimatedVolume === 'high' ? 25 : topic.estimatedVolume === 'medium' ? 15 : 5;

  // Competition (prefer low)
  score += topic.competition === 'low' ? 20 : topic.competition === 'medium' ? 10 : 0;

  // Trending score
  score += topic.trendingScore * 2;

  // Commercial intent bonus
  score += topic.searchIntent === 'commercial' ? 15 : topic.searchIntent === 'transactional' ? 10 : 5;

  return score;
}

function saveResearchReport(report: ResearchReport): void {
  const dir = path.join(process.cwd(), 'scripts', 'research-data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filename = `research-${report.category || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
  const filePath = path.join(dir, filename);

  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Saved research report: ${filePath}`);
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

  const targetCategory = getArg('category');
  const outputFormat = getArg('output') || 'console';

  console.log('\n🔍 CONTENT RESEARCH & TREND ANALYSIS');
  console.log('═'.repeat(50));
  console.log(`📅 Date: ${new Date().toISOString().split('T')[0]}`);
  console.log(`🎯 Category: ${targetCategory || 'All categories'}`);
  console.log('═'.repeat(50));

  const categories = targetCategory
    ? [targetCategory]
    : ['solar', 'roofing', 'hvac', 'windows', 'plumbing', 'electrical'];

  const existingTopics = getExistingTopics();
  console.log(`\n📚 Existing blog posts: ${existingTopics.length}`);

  const allTopicIdeas: TopicIdea[] = [];
  const allContentGaps: string[] = [];
  const sourcesAnalyzed: string[] = [];

  for (const category of categories) {
    console.log(`\n\n📂 Researching: ${category.toUpperCase()}`);
    console.log('─'.repeat(40));

    // Get relevant sources for this category
    const relevantSources = RESEARCH_SOURCES.filter(s =>
      s.categories.includes(category)
    );

    console.log(`   Sources to analyze: ${relevantSources.length}`);

    // Analyze each source
    for (const source of relevantSources.slice(0, 3)) { // Limit to top 3 per category
      console.log(`   📡 Analyzing: ${source.name}...`);
      const ideas = await analyzeSourceForTopics(source, category, existingTopics);
      allTopicIdeas.push(...ideas);
      sourcesAnalyzed.push(source.name);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Generate trending topics
    console.log(`   📈 Analyzing trends...`);
    const trendingTopics = await generateTrendingTopics(category);
    allTopicIdeas.push(...trendingTopics);

    // Identify content gaps
    console.log(`   🔎 Identifying content gaps...`);
    const gaps = await identifyContentGaps(category, existingTopics);
    allContentGaps.push(...gaps.map(g => `[${category}] ${g}`));

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Prioritize and deduplicate topics
  const uniqueTopics = allTopicIdeas.filter((topic, index, self) =>
    index === self.findIndex(t => t.title.toLowerCase() === topic.title.toLowerCase())
  );
  const prioritizedTopics = prioritizeTopics(uniqueTopics);

  // Generate report
  const report: ResearchReport = {
    generatedAt: new Date().toISOString(),
    category: targetCategory,
    sourcesAnalyzed: [...new Set(sourcesAnalyzed)],
    topicIdeas: prioritizedTopics,
    siloRecommendations: categories.map(c => SILO_TEMPLATES[c]).filter(Boolean),
    trendingThemes: prioritizedTopics
      .filter(t => t.trendingScore >= 8)
      .map(t => t.title)
      .slice(0, 10),
    contentGaps: allContentGaps,
  };

  // Output results
  console.log('\n\n═'.repeat(50));
  console.log('📊 RESEARCH RESULTS');
  console.log('═'.repeat(50));

  console.log(`\n✅ Topics discovered: ${prioritizedTopics.length}`);
  console.log(`📈 Trending topics: ${report.trendingThemes.length}`);
  console.log(`🔎 Content gaps identified: ${allContentGaps.length}`);

  console.log('\n\n🏆 TOP 10 RECOMMENDED TOPICS:');
  console.log('─'.repeat(40));

  prioritizedTopics.slice(0, 10).forEach((topic, i) => {
    const siloIcon = topic.silo === 'pillar' ? '🏛️' : topic.silo === 'cluster' ? '🔗' : '📄';
    const intentIcon = topic.searchIntent === 'commercial' ? '💰' : topic.searchIntent === 'transactional' ? '🛒' : '📚';

    console.log(`\n${i + 1}. ${siloIcon} ${topic.title}`);
    console.log(`   Category: ${topic.category} | Intent: ${intentIcon} ${topic.searchIntent}`);
    console.log(`   Volume: ${topic.estimatedVolume} | Competition: ${topic.competition} | Trending: ${topic.trendingScore}/10`);
    console.log(`   Keywords: ${topic.targetKeywords.join(', ')}`);
    console.log(`   Source: ${topic.sourceInspiration}`);
  });

  console.log('\n\n🔎 CONTENT GAPS TO ADDRESS:');
  console.log('─'.repeat(40));
  allContentGaps.slice(0, 5).forEach((gap, i) => {
    console.log(`${i + 1}. ${gap}`);
  });

  console.log('\n\n🏗️ SILO STRUCTURE RECOMMENDATIONS:');
  console.log('─'.repeat(40));
  categories.forEach(cat => {
    const silo = SILO_TEMPLATES[cat];
    if (silo) {
      console.log(`\n📁 ${cat.toUpperCase()}`);
      console.log(`   Pillar: "${silo.pillar.topic}"`);
      console.log(`   Clusters: ${silo.clusters.length} topic groups`);
    }
  });

  // Save report
  if (outputFormat === 'json') {
    saveResearchReport(report);
  }

  // Save topics for auto-generate to use
  const topicsFile = path.join(process.cwd(), 'scripts', 'research-data', 'latest-topics.json');
  const topicsDir = path.dirname(topicsFile);
  if (!fs.existsSync(topicsDir)) {
    fs.mkdirSync(topicsDir, { recursive: true });
  }
  fs.writeFileSync(topicsFile, JSON.stringify(prioritizedTopics, null, 2));
  console.log(`\n💾 Saved topic list: ${topicsFile}`);

  console.log('\n\n✅ Research complete!');
  console.log('Run `npm run blog:auto` to generate articles from these topics.\n');
}

main().catch(console.error);

export { TopicIdea, SiloStructure, SILO_TEMPLATES };
