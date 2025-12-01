/**
 * Competitor Content Scanner
 *
 * Scans top US home improvement sites for trending topics and content ideas:
 * - HomeAdvisor, Angi, Thumbtack (lead gen competitors)
 * - This Old House, Bob Vila (editorial)
 * - EnergySage, Solar Reviews (solar specific)
 *
 * Usage:
 *   npm run blog:scan                    # Scan all categories
 *   npm run blog:scan -- --category solar # Focus on solar
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const anthropic = new Anthropic();

// =============================================================================
// COMPETITOR SITES TO SCAN
// =============================================================================

interface CompetitorSite {
  name: string;
  baseUrl: string;
  contentUrls: Record<string, string>; // category -> URL
  type: 'leadgen' | 'editorial' | 'specialist';
}

const COMPETITORS: CompetitorSite[] = [
  // Lead Gen Competitors
  {
    name: 'HomeAdvisor',
    baseUrl: 'https://www.homeadvisor.com',
    type: 'leadgen',
    contentUrls: {
      solar: 'https://www.homeadvisor.com/cost/heating-and-cooling/install-solar-panels/',
      roofing: 'https://www.homeadvisor.com/cost/roofing/',
      hvac: 'https://www.homeadvisor.com/cost/heating-and-cooling/',
      windows: 'https://www.homeadvisor.com/cost/doors-and-windows/',
      plumbing: 'https://www.homeadvisor.com/cost/plumbing/',
      electrical: 'https://www.homeadvisor.com/cost/electrical/',
    }
  },
  {
    name: 'Angi',
    baseUrl: 'https://www.angi.com',
    type: 'leadgen',
    contentUrls: {
      solar: 'https://www.angi.com/articles/solar-panel-installation-cost.htm',
      roofing: 'https://www.angi.com/articles/how-much-does-new-roof-cost.htm',
      hvac: 'https://www.angi.com/articles/how-much-does-hvac-system-cost.htm',
      windows: 'https://www.angi.com/articles/how-much-do-replacement-windows-cost.htm',
      plumbing: 'https://www.angi.com/articles/how-much-do-plumbers-charge.htm',
      electrical: 'https://www.angi.com/articles/how-much-do-electricians-charge.htm',
    }
  },
  {
    name: 'Fixr',
    baseUrl: 'https://www.fixr.com',
    type: 'leadgen',
    contentUrls: {
      solar: 'https://www.fixr.com/costs/solar-panel-installation',
      roofing: 'https://www.fixr.com/costs/roof-replacement',
      hvac: 'https://www.fixr.com/costs/central-air-conditioning',
      windows: 'https://www.fixr.com/costs/window-replacement',
      plumbing: 'https://www.fixr.com/costs/plumber',
      electrical: 'https://www.fixr.com/costs/electrician',
    }
  },
  // Editorial Sites
  {
    name: 'This Old House',
    baseUrl: 'https://www.thisoldhouse.com',
    type: 'editorial',
    contentUrls: {
      solar: 'https://www.thisoldhouse.com/solar-alternative-energy',
      roofing: 'https://www.thisoldhouse.com/roofing',
      hvac: 'https://www.thisoldhouse.com/heating-cooling',
      windows: 'https://www.thisoldhouse.com/windows',
      plumbing: 'https://www.thisoldhouse.com/plumbing',
      electrical: 'https://www.thisoldhouse.com/electrical',
    }
  },
  {
    name: 'Bob Vila',
    baseUrl: 'https://www.bobvila.com',
    type: 'editorial',
    contentUrls: {
      solar: 'https://www.bobvila.com/articles/solar-panel-cost/',
      roofing: 'https://www.bobvila.com/articles/roof-replacement-cost/',
      hvac: 'https://www.bobvila.com/articles/hvac-system-cost/',
      windows: 'https://www.bobvila.com/articles/window-replacement-cost/',
      plumbing: 'https://www.bobvila.com/articles/plumber-cost/',
      electrical: 'https://www.bobvila.com/articles/electrician-cost/',
    }
  },
  // Solar Specialists
  {
    name: 'EnergySage',
    baseUrl: 'https://www.energysage.com',
    type: 'specialist',
    contentUrls: {
      solar: 'https://www.energysage.com/local-data/solar-panel-cost/',
    }
  },
  {
    name: 'Solar Reviews',
    baseUrl: 'https://www.solarreviews.com',
    type: 'specialist',
    contentUrls: {
      solar: 'https://www.solarreviews.com/blog/',
    }
  },
];

// =============================================================================
// TYPES
// =============================================================================

interface ScannedTopic {
  title: string;
  category: string;
  source: string;
  sourceUrl: string;
  contentType: 'cost-guide' | 'how-to' | 'comparison' | 'tips' | 'news';
  estimatedVolume: 'high' | 'medium' | 'low';
  competition: 'high' | 'medium' | 'low';
  uniqueAngle: string;
  targetKeywords: string[];
  silo: 'pillar' | 'cluster' | 'supporting';
}

interface ScanResult {
  scannedAt: string;
  category: string;
  sitesScanned: string[];
  topicsFound: ScannedTopic[];
  trendingThemes: string[];
  contentGaps: string[];
}

// =============================================================================
// SCANNING FUNCTIONS
// =============================================================================

async function fetchPageContent(url: string): Promise<string | null> {
  try {
    console.log(`   📡 Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.log(`   ⚠️ HTTP ${response.status} for ${url}`);
      return null;
    }

    const html = await response.text();

    // Extract text content (basic HTML stripping)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 15000); // Limit content size

    return textContent;
  } catch (error) {
    console.log(`   ❌ Error fetching ${url}: ${error instanceof Error ? error.message : 'Unknown'}`);
    return null;
  }
}

async function analyzeCompetitorContent(
  siteName: string,
  siteUrl: string,
  pageContent: string,
  category: string
): Promise<ScannedTopic[]> {

  const prompt = `Analyze this competitor content from ${siteName} and extract blog topic ideas.

CONTENT FROM: ${siteUrl}
CATEGORY: ${category}

CONTENT:
${pageContent.slice(0, 10000)}

Based on this content, generate 3-5 unique blog topic ideas that we could write BETTER content about.

For each topic, identify:
1. A catchy, SEO-optimized title
2. The content type (cost-guide, how-to, comparison, tips, news)
3. What unique angle we could take
4. Target keywords

Return as JSON array:
[
  {
    "title": "SEO-optimized article title",
    "contentType": "cost-guide|how-to|comparison|tips|news",
    "estimatedVolume": "high|medium|low",
    "competition": "high|medium|low",
    "uniqueAngle": "How we can do it better than ${siteName}",
    "targetKeywords": ["keyword1", "keyword2", "keyword3"],
    "silo": "pillar|cluster|supporting"
  }
]

Focus on:
- Topics with commercial intent (people looking to hire/buy)
- Cost-related content (always high volume)
- Comparison content (vs, alternatives)
- Problem-solving content (signs, when to, how to fix)

Return ONLY valid JSON array.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') return [];

    const topics = JSON.parse(textContent.text);
    return topics.map((t: Partial<ScannedTopic>) => ({
      ...t,
      category,
      source: siteName,
      sourceUrl: siteUrl,
    }));
  } catch (error) {
    console.log(`   ❌ Error analyzing content: ${error}`);
    return [];
  }
}

async function identifyTrendingThemes(
  allTopics: ScannedTopic[],
  category: string
): Promise<{ themes: string[]; gaps: string[] }> {

  const topicsList = allTopics.map(t => `- ${t.title} (${t.source})`).join('\n');

  const prompt = `Analyze these topics found across competitor sites for "${category}":

${topicsList}

Identify:
1. TRENDING THEMES: What topics are multiple competitors covering? (indicates high demand)
2. CONTENT GAPS: What important topics are competitors NOT covering well?

Return as JSON:
{
  "themes": ["theme1", "theme2", "theme3"],
  "gaps": ["gap1", "gap2", "gap3"]
}

Return ONLY valid JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return { themes: [], gaps: [] };
    }

    return JSON.parse(textContent.text);
  } catch {
    return { themes: [], gaps: [] };
  }
}

// =============================================================================
// MAIN SCAN FUNCTION
// =============================================================================

async function scanCategory(category: string): Promise<ScanResult> {
  console.log(`\n📂 Scanning: ${category.toUpperCase()}`);
  console.log('─'.repeat(40));

  const allTopics: ScannedTopic[] = [];
  const sitesScanned: string[] = [];

  // Get relevant competitors for this category
  const relevantCompetitors = COMPETITORS.filter(c =>
    c.contentUrls[category] !== undefined
  );

  console.log(`   Found ${relevantCompetitors.length} competitor sites`);

  for (const competitor of relevantCompetitors) {
    const url = competitor.contentUrls[category];
    if (!url) continue;

    console.log(`\n   🔍 ${competitor.name}`);

    const content = await fetchPageContent(url);
    if (!content) continue;

    sitesScanned.push(competitor.name);

    const topics = await analyzeCompetitorContent(
      competitor.name,
      url,
      content,
      category
    );

    console.log(`   ✅ Found ${topics.length} topic ideas`);
    allTopics.push(...topics);

    // Rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  // Analyze trends across all topics
  console.log(`\n   📊 Analyzing trends...`);
  const { themes, gaps } = await identifyTrendingThemes(allTopics, category);

  return {
    scannedAt: new Date().toISOString(),
    category,
    sitesScanned,
    topicsFound: allTopics,
    trendingThemes: themes,
    contentGaps: gaps,
  };
}

// =============================================================================
// SAVE & MERGE WITH EXISTING RESEARCH
// =============================================================================

function saveResults(results: ScanResult[]): void {
  const dir = path.join(process.cwd(), 'scripts', 'research-data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Save full scan report
  const reportFile = path.join(dir, `competitor-scan-${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Saved full report: ${reportFile}`);

  // Convert to format compatible with auto-generate
  const allTopics = results.flatMap(r => r.topicsFound.map(t => ({
    title: t.title,
    category: t.category,
    silo: t.silo,
    searchIntent: t.contentType === 'cost-guide' ? 'commercial' :
                  t.contentType === 'comparison' ? 'commercial' : 'informational',
    estimatedVolume: t.estimatedVolume,
    competition: t.competition,
    trendingScore: 8, // From competitor = likely trending
    targetKeywords: t.targetKeywords,
    contentAngle: t.uniqueAngle,
    uniqueValue: `Better than ${t.source}`,
    sourceInspiration: t.source,
  })));

  // Save for auto-generate to use
  const topicsFile = path.join(dir, 'latest-topics.json');
  fs.writeFileSync(topicsFile, JSON.stringify(allTopics, null, 2));
  console.log(`💾 Saved topics for generation: ${topicsFile}`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string) => {
    const idx = args.indexOf(`--${name}`);
    return idx > -1 ? args[idx + 1] : undefined;
  };

  const targetCategory = getArg('category');
  const categories = targetCategory
    ? [targetCategory]
    : ['solar', 'roofing', 'hvac', 'windows', 'plumbing', 'electrical'];

  console.log('\n🔍 COMPETITOR CONTENT SCANNER');
  console.log('═'.repeat(50));
  console.log(`📅 Date: ${new Date().toISOString().split('T')[0]}`);
  console.log(`🎯 Categories: ${categories.join(', ')}`);
  console.log('═'.repeat(50));

  const results: ScanResult[] = [];

  for (const category of categories) {
    const result = await scanCategory(category);
    results.push(result);
  }

  // Save results
  saveResults(results);

  // Print summary
  console.log('\n═'.repeat(50));
  console.log('📊 SCAN SUMMARY');
  console.log('═'.repeat(50));

  let totalTopics = 0;
  for (const result of results) {
    console.log(`\n📁 ${result.category.toUpperCase()}`);
    console.log(`   Sites scanned: ${result.sitesScanned.join(', ')}`);
    console.log(`   Topics found: ${result.topicsFound.length}`);
    console.log(`   Trending themes: ${result.trendingThemes.slice(0, 3).join(', ')}`);
    totalTopics += result.topicsFound.length;
  }

  console.log(`\n✅ Total topics discovered: ${totalTopics}`);
  console.log('\nRun `npm run blog:auto --from-research` to generate articles!\n');
}

main().catch(console.error);
