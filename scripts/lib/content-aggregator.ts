/**
 * Content Aggregator - Creates unique articles from multiple sources
 *
 * This script:
 * 1. Fetches RSS feeds from competitor sites
 * 2. Extracts relevant articles on a topic
 * 3. Uses Claude to synthesize and improve the content
 * 4. Creates a unique, better article
 */

import Anthropic from '@anthropic-ai/sdk';

// RSS feeds for home improvement content
const RSS_SOURCES: Record<string, string[]> = {
  solar: [
    'https://www.solarpowerworldonline.com/feed/',
    'https://www.pv-magazine.com/feed/',
    'https://electrek.co/guides/solar/feed/',
  ],
  roofing: [
    'https://www.roofingcontractor.com/rss',
    'https://www.roofingmagazine.com/feed/',
  ],
  hvac: [
    'https://www.achrnews.com/rss/topic/2648-hvac-residential',
    'https://www.hvacinformed.com/rss/',
  ],
  general: [
    'https://www.thisoldhouse.com/feed',
    'https://www.bobvila.com/feed',
  ]
};

interface ArticleSource {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  content?: string;
}

interface AggregatedContent {
  topic: string;
  sources: ArticleSource[];
  synthesizedArticle: string;
}

/**
 * Fetch and parse RSS feed
 */
async function fetchRSSFeed(feedUrl: string): Promise<ArticleSource[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'MyHomeQuoter/1.0 (Content Aggregator)'
      }
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${feedUrl}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const articles: ArticleSource[] = [];

    // Simple XML parsing for RSS items
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];

      const getTag = (tag: string): string => {
        const tagMatch = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        return tagMatch ? (tagMatch[1] || tagMatch[2] || '').trim() : '';
      };

      articles.push({
        title: getTag('title'),
        description: getTag('description').replace(/<[^>]+>/g, '').slice(0, 500),
        link: getTag('link'),
        pubDate: getTag('pubDate'),
        content: getTag('content:encoded')?.replace(/<[^>]+>/g, '').slice(0, 2000)
      });
    }

    return articles.slice(0, 10); // Limit to 10 most recent
  } catch (error) {
    console.error(`Error fetching ${feedUrl}:`, error);
    return [];
  }
}

/**
 * Search articles for a specific topic
 */
async function findArticlesOnTopic(
  topic: string,
  category: string = 'general'
): Promise<ArticleSource[]> {
  const feeds = [
    ...(RSS_SOURCES[category] || []),
    ...(RSS_SOURCES.general || [])
  ];

  const allArticles: ArticleSource[] = [];

  for (const feed of feeds) {
    const articles = await fetchRSSFeed(feed);
    allArticles.push(...articles);
  }

  // Filter articles that match the topic
  const topicWords = topic.toLowerCase().split(/\s+/);
  const relevantArticles = allArticles.filter(article => {
    const text = `${article.title} ${article.description}`.toLowerCase();
    return topicWords.some(word => text.includes(word));
  });

  // Sort by relevance (more matching words = more relevant)
  relevantArticles.sort((a, b) => {
    const textA = `${a.title} ${a.description}`.toLowerCase();
    const textB = `${b.title} ${b.description}`.toLowerCase();
    const scoreA = topicWords.filter(w => textA.includes(w)).length;
    const scoreB = topicWords.filter(w => textB.includes(w)).length;
    return scoreB - scoreA;
  });

  return relevantArticles.slice(0, 5); // Top 5 most relevant
}

/**
 * Synthesize multiple articles into one unique, improved article
 */
async function synthesizeContent(
  topic: string,
  sources: ArticleSource[],
  category: string
): Promise<string> {
  const client = new Anthropic();

  const sourceSummaries = sources.map((s, i) => `
Source ${i + 1}: "${s.title}"
Summary: ${s.description}
${s.content ? `Content excerpt: ${s.content.slice(0, 500)}...` : ''}
`).join('\n---\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `You are a senior content writer for MyHomeQuoter, a US home improvement lead generation site.

I have found ${sources.length} articles about "${topic}" in the ${category} category. Your task is to create a UNIQUE, BETTER article by:

1. Synthesizing the key information from all sources
2. Adding your expert knowledge
3. Making it more comprehensive and actionable
4. Optimizing for SEO with the target keyword: "${topic}"
5. Including specific data, costs, and recommendations

SOURCE ARTICLES:
${sourceSummaries}

REQUIREMENTS:
- Write 2000-3000 words
- Include an engaging intro with a hook
- Add practical tips not found in source articles
- Include a FAQ section with 5-7 questions
- Add internal links to /get-quotes/${category}/ and /blog/
- Use markdown formatting with proper headers (##, ###)
- Make it 100% unique - do NOT copy any sentences from sources
- Focus on US homeowners
- Include specific cost ranges and timeframes

Write the complete article now:`
    }]
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

/**
 * Main function: Create unique content from aggregated sources
 */
export async function createAggregatedArticle(
  topic: string,
  category: string
): Promise<AggregatedContent | null> {
  console.log(`\n📰 Aggregating content for: "${topic}" (${category})\n`);

  // Find relevant articles
  const sources = await findArticlesOnTopic(topic, category);

  if (sources.length < 2) {
    console.log(`⚠️ Not enough source articles found (${sources.length})`);
    return null;
  }

  console.log(`✅ Found ${sources.length} relevant source articles`);
  sources.forEach((s, i) => console.log(`   ${i + 1}. ${s.title}`));

  // Synthesize into unique content
  console.log('\n🔄 Synthesizing unique content...\n');
  const synthesizedArticle = await synthesizeContent(topic, sources, category);

  return {
    topic,
    sources,
    synthesizedArticle
  };
}

/**
 * Generate trending topics to aggregate
 */
export function getTrendingTopics(category: string): string[] {
  const topics: Record<string, string[]> = {
    solar: [
      'solar panel cost 2024',
      'best solar batteries',
      'solar tax credits',
      'solar panel efficiency',
      'solar vs grid electricity'
    ],
    roofing: [
      'roof replacement cost',
      'metal roof vs shingles',
      'roof inspection checklist',
      'storm damage roof repair',
      'energy efficient roofing'
    ],
    hvac: [
      'heat pump vs furnace',
      'HVAC maintenance tips',
      'smart thermostat savings',
      'ductless mini split cost',
      'HVAC replacement signs'
    ]
  };

  return topics[category] || topics.solar;
}

// Export for use in blog generator
export { fetchRSSFeed, findArticlesOnTopic, synthesizeContent };
