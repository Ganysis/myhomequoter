/**
 * Content Generation Script for MyHomeQuoter
 *
 * This script generates SEO-optimized content for landing pages using Claude API.
 * Run with: npx tsx scripts/generate-content.ts
 *
 * Usage:
 *   1. Set ANTHROPIC_API_KEY environment variable
 *   2. Run: npx tsx scripts/generate-content.ts --niche solar --state TX --city Houston
 *   3. Review generated content in src/content/landings/
 *   4. Approve or edit, then rebuild site
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const anthropic = new Anthropic();

interface GenerationOptions {
  niche: string;
  nicheName: string;
  city: string;
  state: string;
  stateName: string;
}

interface BlogPostOptions {
  category: string;
  categoryName: string;
  topic: string;
  targetKeywords: string[];
  featured?: boolean;
}

interface BlogPostContent {
  title: string;
  description: string;
  author: string;
  readingTime: number;
  tags: string[];
  content: string;
}

interface ContentQualityScore {
  overall: number;
  breakdown: {
    wordCount: { score: number; value: number; target: string };
    headingStructure: { score: number; h2Count: number; h3Count: number };
    dataElements: { score: number; tables: number; lists: number };
    internalLinks: { score: number; count: number };
    readability: { score: number; avgSentenceLength: number };
    seoElements: { score: number; details: string[] };
  };
  suggestions: string[];
}

/**
 * Analyzes generated content and returns a quality score
 */
function scoreContentQuality(content: BlogPostContent, category: string): ContentQualityScore {
  const md = content.content;
  const suggestions: string[] = [];

  // Word count analysis
  const wordCount = md.split(/\s+/).length;
  const wordCountScore = wordCount >= 2500 ? 100 : wordCount >= 2000 ? 80 : wordCount >= 1500 ? 60 : 40;
  if (wordCount < 2000) suggestions.push(`Content is ${wordCount} words. Aim for 2000-3000 for better rankings.`);

  // Heading structure
  const h2Matches = md.match(/^## /gm) || [];
  const h3Matches = md.match(/^### /gm) || [];
  const h2Count = h2Matches.length;
  const h3Count = h3Matches.length;
  const headingScore = h2Count >= 6 && h3Count >= 4 ? 100 : h2Count >= 4 ? 70 : 50;
  if (h2Count < 5) suggestions.push(`Only ${h2Count} H2 headings. Add more sections for depth.`);

  // Data elements (tables, lists)
  const tableMatches = md.match(/\|.*\|/g) || [];
  const listMatches = md.match(/^[-*]\s/gm) || [];
  const numberedListMatches = md.match(/^\d+\.\s/gm) || [];
  const tables = tableMatches.length > 0 ? Math.floor(tableMatches.length / 3) : 0; // Approximate table count
  const lists = listMatches.length + numberedListMatches.length;
  const dataScore = tables >= 2 && lists >= 15 ? 100 : tables >= 1 && lists >= 10 ? 80 : 60;
  if (tables < 2) suggestions.push('Add more data tables for featured snippet optimization.');

  // Internal links
  const linkPattern = new RegExp(`\\(/(?:get-quotes|${category}|blog)`, 'g');
  const internalLinkMatches = md.match(linkPattern) || [];
  const linkCount = internalLinkMatches.length;
  const linkScore = linkCount >= 3 ? 100 : linkCount >= 2 ? 80 : linkCount >= 1 ? 60 : 30;
  if (linkCount < 2) suggestions.push('Add more internal links to service and category pages.');

  // Readability (simplified)
  const sentences = md.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = wordCount / sentences.length;
  const readabilityScore = avgSentenceLength <= 20 ? 100 : avgSentenceLength <= 25 ? 80 : 60;
  if (avgSentenceLength > 22) suggestions.push('Sentences are long. Break up for better readability.');

  // SEO elements check
  const seoDetails: string[] = [];
  const hasFAQ = /##.*FAQ|##.*Questions/i.test(md);
  const hasProTip = />\s*\*?\*?Pro Tip|>\s*\*?\*?Key Takeaway/i.test(md);
  const hasCTA = /get.*quote|free.*quote/i.test(md);
  const hasNumbers = /\$[\d,]+|\d+%|\d+ (years?|months?|weeks?|days?)/g.test(md);

  if (hasFAQ) seoDetails.push('✓ FAQ section');
  else suggestions.push('Add FAQ section for PAA optimization.');

  if (hasProTip) seoDetails.push('✓ Pro tip callouts');
  else suggestions.push('Add Pro Tip callout boxes.');

  if (hasCTA) seoDetails.push('✓ CTA present');
  else suggestions.push('Add clear call-to-action.');

  if (hasNumbers) seoDetails.push('✓ Specific data/numbers');
  else suggestions.push('Include more specific numbers and statistics.');

  const seoScore = (hasFAQ ? 25 : 0) + (hasProTip ? 25 : 0) + (hasCTA ? 25 : 0) + (hasNumbers ? 25 : 0);

  // Calculate overall score
  const overall = Math.round(
    (wordCountScore * 0.2) +
    (headingScore * 0.15) +
    (dataScore * 0.2) +
    (linkScore * 0.15) +
    (readabilityScore * 0.1) +
    (seoScore * 0.2)
  );

  return {
    overall,
    breakdown: {
      wordCount: { score: wordCountScore, value: wordCount, target: '2000-3000' },
      headingStructure: { score: headingScore, h2Count, h3Count },
      dataElements: { score: dataScore, tables, lists },
      internalLinks: { score: linkScore, count: linkCount },
      readability: { score: readabilityScore, avgSentenceLength: Math.round(avgSentenceLength) },
      seoElements: { score: seoScore, details: seoDetails },
    },
    suggestions,
  };
}

function printQualityReport(score: ContentQualityScore): void {
  const getGrade = (s: number) => s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 70 ? 'C' : s >= 60 ? 'D' : 'F';
  const getColor = (s: number) => s >= 80 ? '\x1b[32m' : s >= 60 ? '\x1b[33m' : '\x1b[31m';
  const reset = '\x1b[0m';

  console.log('\n📊 CONTENT QUALITY SCORE');
  console.log('═'.repeat(50));
  console.log(`${getColor(score.overall)}Overall: ${score.overall}/100 (${getGrade(score.overall)})${reset}\n`);

  console.log('Breakdown:');
  console.log(`  📝 Word Count: ${score.breakdown.wordCount.value} words (${score.breakdown.wordCount.score}/100)`);
  console.log(`  📑 Headings: ${score.breakdown.headingStructure.h2Count} H2s, ${score.breakdown.headingStructure.h3Count} H3s (${score.breakdown.headingStructure.score}/100)`);
  console.log(`  📊 Data Elements: ${score.breakdown.dataElements.tables} tables, ${score.breakdown.dataElements.lists} list items (${score.breakdown.dataElements.score}/100)`);
  console.log(`  🔗 Internal Links: ${score.breakdown.internalLinks.count} links (${score.breakdown.internalLinks.score}/100)`);
  console.log(`  📖 Readability: ${score.breakdown.readability.avgSentenceLength} words/sentence (${score.breakdown.readability.score}/100)`);
  console.log(`  🎯 SEO Elements: ${score.breakdown.seoElements.details.join(', ') || 'None'} (${score.breakdown.seoElements.score}/100)`);

  if (score.suggestions.length > 0) {
    console.log('\n💡 Suggestions for improvement:');
    score.suggestions.forEach(s => console.log(`  • ${s}`));
  }
  console.log('═'.repeat(50));
}

const SYSTEM_PROMPT = `You are an expert SEO content writer specializing in home services content for the US market.
Your task is to generate high-quality, unique landing page content that:
- Is optimized for local SEO (city + service keywords)
- Follows E-E-A-T guidelines (Experience, Expertise, Authoritativeness, Trustworthiness)
- Uses natural, conversational American English
- Includes relevant local details when possible
- Avoids generic filler content
- Focuses on user intent (getting quotes, finding contractors)

Format your output as valid JSON matching the specified schema.`;

async function generateLandingPageContent(options: GenerationOptions): Promise<object> {
  const { niche, nicheName, city, state, stateName } = options;

  const prompt = `Generate landing page content for: ${nicheName} services in ${city}, ${state}

Create unique, SEO-optimized content in JSON format with these fields:

{
  "meta": {
    "title": "SEO title (max 60 chars) - include city, state, service",
    "description": "Meta description (max 155 chars) - compelling, includes CTA"
  },
  "hero": {
    "headline": "Main H1 headline",
    "subheadline": "Supporting text (1-2 sentences)"
  },
  "intro": {
    "text": "2-3 paragraphs introducing the service in this location. Include local context if relevant (climate for HVAC/solar, common home types for roofing, etc.)"
  },
  "benefits": [
    {
      "title": "Benefit title",
      "description": "1-2 sentences explaining this benefit"
    }
  ],
  "localInfo": {
    "averageCost": "Local price range estimate",
    "timeline": "Typical project timeline",
    "permits": "Brief note about local permit requirements"
  },
  "faqs": [
    {
      "question": "Location-specific FAQ",
      "answer": "Detailed answer (2-3 sentences)"
    }
  ],
  "cta": {
    "headline": "CTA section headline",
    "text": "Supporting CTA text"
  }
}

Requirements:
- Generate 3 unique benefits
- Generate 5 unique FAQs relevant to ${nicheName} in ${city}, ${stateName}
- Make content specific to this location, not generic
- Include natural keyword usage for "${nicheName} ${city} ${state}"
- All content should be original and not templated

Return ONLY valid JSON, no other text.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in response');
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse JSON from response');
  }
}

async function generateArticleContent(
  niche: string,
  nicheName: string,
  topic: string,
  targetKeywords: string[]
): Promise<object> {
  const prompt = `Write an informative article about: "${topic}"

Target keywords: ${targetKeywords.join(', ')}

Create SEO-optimized article content in JSON format:

{
  "meta": {
    "title": "SEO title (max 60 chars)",
    "description": "Meta description (max 155 chars)"
  },
  "content": {
    "intro": "2-3 paragraph introduction",
    "sections": [
      {
        "heading": "H2 section heading",
        "content": "3-4 paragraphs of content for this section"
      }
    ],
    "conclusion": "Concluding paragraph with CTA"
  },
  "faqs": [
    {
      "question": "Related FAQ",
      "answer": "Detailed answer"
    }
  ]
}

Requirements:
- 4-6 main sections
- 1500-2000 words total
- Natural keyword integration
- Actionable, helpful content
- Include 3-5 FAQs

Return ONLY valid JSON.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in response');
  }

  return JSON.parse(textContent.text);
}

// =============================================================================
// ADVANCED SEO BLOG GENERATION SYSTEM
// =============================================================================

/**
 * SEO CONTENT STRATEGY - THE FULL FRAMEWORK
 *
 * 1. SEARCH INTENT OPTIMIZATION
 *    - Informational (how to, what is, guide)
 *    - Commercial Investigation (best, vs, comparison, cost)
 *    - Transactional (buy, hire, get quotes)
 *
 * 2. E-E-A-T SIGNALS (Google Quality Guidelines)
 *    - Experience: First-hand knowledge, real examples
 *    - Expertise: Technical depth, industry terminology
 *    - Authoritativeness: Citations, data sources, credentials
 *    - Trustworthiness: Balanced view, disclaimers, transparency
 *
 * 3. FEATURED SNIPPET OPTIMIZATION
 *    - Definition paragraphs (40-60 words)
 *    - Numbered lists for "how to" queries
 *    - Tables for comparisons
 *    - FAQ schema for People Also Ask
 *
 * 4. CONTENT STRUCTURE (PROVEN RANKING PATTERNS)
 *    - Title: Primary keyword + modifier + year/number
 *    - H1: Matches title, includes main keyword
 *    - H2s: Long-tail variations, question format
 *    - H3s: Specific sub-topics for depth
 *
 * 5. INTERNAL LINKING STRATEGY
 *    - Link to relevant service pages (/get-quotes/niche/)
 *    - Link to related blog posts
 *    - Link to location pages when relevant
 */

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

// Determine search intent from topic
function analyzeSearchIntent(topic: string): 'informational' | 'commercial' | 'transactional' {
  const commercialPatterns = /cost|price|worth|vs|versus|best|top|comparison|review/i;
  const transactionalPatterns = /buy|hire|get|find|near me|quote/i;
  const informationalPatterns = /how|what|why|guide|tips|signs|when/i;

  if (transactionalPatterns.test(topic)) return 'transactional';
  if (commercialPatterns.test(topic)) return 'commercial';
  return 'informational';
}

// Get related internal links based on category
function getInternalLinks(category: string): string[] {
  const links: Record<string, string[]> = {
    solar: [
      '/get-quotes/solar/',
      '/solar/',
      '/blog/category/solar/',
    ],
    roofing: [
      '/get-quotes/roofing/',
      '/roofing/',
      '/blog/category/roofing/',
    ],
    hvac: [
      '/get-quotes/hvac/',
      '/hvac/',
      '/blog/category/hvac/',
    ],
    windows: [
      '/get-quotes/windows/',
      '/windows/',
      '/blog/category/windows/',
    ],
    plumbing: [
      '/get-quotes/plumbing/',
      '/plumbing/',
      '/blog/category/plumbing/',
    ],
    electrical: [
      '/get-quotes/electrical/',
      '/electrical/',
      '/blog/category/electrical/',
    ],
  };
  return links[category] || [];
}

async function generateBlogPost(options: BlogPostOptions): Promise<BlogPostContent> {
  const { category, categoryName, topic, targetKeywords, featured } = options;
  const searchIntent = analyzeSearchIntent(topic);
  const internalLinks = getInternalLinks(category);

  const prompt = `Create an expert-level blog post that will RANK on Google and CONVERT readers.

TOPIC: "${topic}"
CATEGORY: ${categoryName}
PRIMARY KEYWORDS: ${targetKeywords.join(', ')}
SEARCH INTENT: ${searchIntent.toUpperCase()}
${featured ? '⭐ THIS IS A FEATURED/PILLAR POST - Make it your absolute best work' : ''}

=== OUTPUT FORMAT (JSON) ===
{
  "title": "SEO title following pattern: [Primary Keyword] + [Modifier] + [Year/Number]",
  "description": "Meta description (150-160 chars) with: keyword, benefit, CTA. Example: 'Solar panels cost $15,000-$25,000 in 2024. Learn about incentives, ROI, and get free quotes from top installers.'",
  "author": "Realistic expert name with credentials (e.g., 'Mike Rodriguez, 20-Year HVAC Technician')",
  "readingTime": <calculated based on ~200 words/min>,
  "tags": ["primary keyword", "long-tail 1", "long-tail 2", "related topic", "location-agnostic"],
  "content": "<FULL MARKDOWN ARTICLE - see structure below>"
}

=== CONTENT STRUCTURE REQUIREMENTS ===

**OPENING (Critical for Engagement)**
- First paragraph: Hook + answer the main question immediately (featured snippet optimization)
- Include a "quick answer" summary box for skimmers
- State your credentials/experience context

**FEATURED SNIPPET OPTIMIZATION**
- For "what is" queries: 40-60 word definition paragraph
- For "how to" queries: Numbered steps (5-8 steps ideal)
- For "cost" queries: Price table with ranges
- For "best" queries: Comparison table

**REQUIRED SECTIONS (adapt headings to topic):**

1. ## [Main Topic] Overview/Introduction
   - Define the topic clearly (featured snippet target)
   - Why this matters to homeowners
   - What you'll learn in this guide

2. ## [Cost/Price Section] (if applicable)
   - SPECIFIC price ranges with factors
   - Table format: | Item | Low | Average | High |
   - Regional cost variations
   - Hidden costs to watch for

3. ## [How-To / Process Section]
   - Numbered steps with details
   - Timeline expectations
   - DIY vs professional comparison

4. ## [Signs/When to Know Section]
   - Bullet list of warning signs
   - Urgency indicators
   - Common mistakes to avoid

5. ## [Comparison/Options Section]
   - Table comparing options
   - Pros and cons for each
   - Best choice for different situations

6. ## [Expert Tips / Pro Advice]
   - Insider knowledge
   - Money-saving strategies
   - Questions to ask contractors

7. ## FAQs (5-7 questions)
   - Target "People Also Ask" queries
   - Concise but complete answers
   - Include long-tail keywords

8. ## Final Thoughts + CTA
   - Summary of key points
   - Clear next step for reader
   - Link to: ${internalLinks[0] || '/get-quotes/' + category + '/'}

=== E-E-A-T REQUIREMENTS ===
- **Experience**: Include phrases like "In my 15 years installing solar panels..." or "Contractors typically..."
- **Expertise**: Use proper industry terminology, explain technical concepts
- **Authority**: Reference industry standards, building codes, manufacturer guidelines
- **Trust**: Include disclaimers where appropriate, present balanced views, mention when to consult professionals

=== DATA & STATISTICS ===
Include REAL, SPECIFIC data points:
- Average costs in 2024 (with source context)
- Typical timelines for projects
- Energy savings percentages
- ROI calculations
- Industry statistics
- Regional variations

=== INTERNAL LINKING ===
Naturally include these links in your content:
${internalLinks.map(link => `- ${link}`).join('\n')}

=== FORMATTING REQUIREMENTS ===
- Use **bold** for key terms and important numbers
- Use *italics* for emphasis and technical terms
- Include at least 2 data tables
- Use bullet lists for features/benefits
- Use numbered lists for processes/steps
- Add a "Key Takeaway" or "Pro Tip" callout box using > blockquote
- Word count: ${featured ? '2500-3500' : '2000-2800'} words

=== TONE & STYLE ===
- Write like you're explaining to a smart friend
- Be specific, not vague ("$18,500" not "expensive")
- Anticipate and address objections
- No fluff, every sentence adds value
- American English, conversational but professional

Return ONLY valid JSON, no markdown code blocks around it.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000, // Increased for comprehensive content
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
    // Try to extract JSON from the response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse JSON from response');
  }
}

function createBlogPostMarkdown(content: BlogPostContent, category: string, featured: boolean): string {
  const today = new Date().toISOString().split('T')[0];

  // Generate image config for this post
  const imageConfig = generateImageConfig(category, content.title);

  const frontmatter = `---
title: "${content.title.replace(/"/g, '\\"')}"
description: "${content.description.replace(/"/g, '\\"')}"
publishDate: ${today}
author: "${content.author}"
category: ${category}
tags: ${JSON.stringify(content.tags)}
image:
  src: "${imageConfig.heroImage}"
  alt: "${content.title.replace(/"/g, '\\"')}"
featured: ${featured}
readingTime: ${content.readingTime}
---

`;

  return frontmatter + content.content;
}

async function saveBlogPost(slug: string, markdownContent: string): Promise<void> {
  const dir = path.join(process.cwd(), 'src', 'content', 'blog');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, `${slug}.md`);
  fs.writeFileSync(filePath, markdownContent);

  console.log(`✓ Saved blog post: ${filePath}`);
}

async function saveContent(
  type: 'landing' | 'article',
  slug: string,
  content: object
): Promise<void> {
  const dir = path.join(process.cwd(), 'src', 'content', type === 'landing' ? 'landings' : 'articles');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, `${slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));

  console.log(`✓ Saved: ${filePath}`);
}

// =============================================================================
// SMART TOPIC SELECTION SYSTEM
// =============================================================================

interface TopicWithMeta {
  topic: string;
  intent: 'transactional' | 'commercial' | 'informational';
  priority: 1 | 2 | 3; // 1 = highest priority (pillar content)
  searchVolume: 'high' | 'medium' | 'low';
  competition: 'high' | 'medium' | 'low';
  seasonality?: string; // e.g., "summer" for AC topics
}

/**
 * Get existing blog posts to avoid duplicates
 */
function getExistingPosts(): string[] {
  const blogDir = path.join(process.cwd(), 'src', 'content', 'blog');
  if (!fs.existsSync(blogDir)) return [];

  return fs.readdirSync(blogDir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));
}

/**
 * Smart topic selection based on:
 * - Gap analysis (what's not covered yet)
 * - Priority scoring
 * - Intent balance (mix of commercial/informational)
 * - Seasonality
 */
function selectSmartTopics(
  category: string,
  count: number,
  options: { prioritizeGaps?: boolean; balanceIntents?: boolean } = {}
): TopicWithMeta[] {
  const existingPosts = getExistingPosts();
  const allTopics = BLOG_TOPICS_WITH_META[category] || [];

  // Filter out existing topics
  const availableTopics = allTopics.filter(t => {
    const slug = t.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return !existingPosts.includes(slug);
  });

  if (availableTopics.length === 0) {
    console.log('⚠️ All predefined topics have been generated. Consider adding new topics.');
    return [];
  }

  // Sort by priority
  const sorted = [...availableTopics].sort((a, b) => {
    // Priority first
    if (a.priority !== b.priority) return a.priority - b.priority;
    // Then by search volume
    const volOrder = { high: 0, medium: 1, low: 2 };
    if (volOrder[a.searchVolume] !== volOrder[b.searchVolume]) {
      return volOrder[a.searchVolume] - volOrder[b.searchVolume];
    }
    // Then by competition (prefer lower)
    const compOrder = { low: 0, medium: 1, high: 2 };
    return compOrder[a.competition] - compOrder[b.competition];
  });

  // If balancing intents, try to mix commercial and informational
  if (options.balanceIntents && count > 1) {
    const result: TopicWithMeta[] = [];
    const byIntent = {
      transactional: sorted.filter(t => t.intent === 'transactional'),
      commercial: sorted.filter(t => t.intent === 'commercial'),
      informational: sorted.filter(t => t.intent === 'informational'),
    };

    // Alternate between intents
    const intents = ['transactional', 'commercial', 'informational'] as const;
    let intentIndex = 0;

    while (result.length < count && result.length < sorted.length) {
      const intent = intents[intentIndex % 3];
      const topic = byIntent[intent].shift();
      if (topic) {
        result.push(topic);
      }
      intentIndex++;

      // If one intent is exhausted, continue with others
      if (byIntent.transactional.length === 0 &&
          byIntent.commercial.length === 0 &&
          byIntent.informational.length === 0) break;
    }

    return result;
  }

  return sorted.slice(0, count);
}

/**
 * Print topic selection report
 */
function printTopicSelectionReport(topics: TopicWithMeta[], category: string): void {
  const existingPosts = getExistingPosts();
  const categoryPosts = existingPosts.filter(p => {
    // Simple heuristic: check if post slug contains category keywords
    return p.includes(category) ||
           BLOG_TOPICS_WITH_META[category]?.some(t =>
             p === t.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
           );
  });

  console.log('\n📊 TOPIC SELECTION REPORT');
  console.log('═'.repeat(50));
  console.log(`Category: ${category}`);
  console.log(`Existing posts: ${categoryPosts.length}`);
  console.log(`Available topics: ${BLOG_TOPICS_WITH_META[category]?.length || 0}`);
  console.log(`\nSelected topics:`);

  topics.forEach((t, i) => {
    const intentEmoji = t.intent === 'transactional' ? '💰' : t.intent === 'commercial' ? '🔍' : '📚';
    const priorityStars = '⭐'.repeat(4 - t.priority);
    console.log(`  ${i + 1}. ${intentEmoji} ${t.topic}`);
    console.log(`     Priority: ${priorityStars} | Volume: ${t.searchVolume} | Competition: ${t.competition}`);
  });
  console.log('═'.repeat(50));
}

/**
 * SEO-OPTIMIZED BLOG TOPICS WITH METADATA
 *
 * Each topic includes:
 * - intent: transactional (ready to buy), commercial (comparing), informational (learning)
 * - priority: 1 (pillar/cornerstone), 2 (important), 3 (supporting)
 * - searchVolume: estimated monthly searches
 * - competition: keyword difficulty
 */
const BLOG_TOPICS_WITH_META: Record<string, TopicWithMeta[]> = {
  solar: [
    // Pillar content - high priority, high volume
    { topic: 'How Much Do Solar Panels Cost in 2024? Complete Pricing Guide', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
    { topic: 'Solar Panel Installation Cost: What to Expect by State', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'medium' },
    { topic: 'Is Solar Worth It? ROI Calculator and Payback Analysis', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'medium' },
    // Comparison content
    { topic: 'Solar Panels vs Solar Shingles: Cost, Efficiency, and Pros/Cons', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'Best Solar Panel Brands 2024: SunPower vs LG vs Panasonic', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
    { topic: 'Lease vs Buy Solar Panels: Which Option Saves More Money?', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
    // Educational content
    { topic: 'Federal Solar Tax Credit 2024: How to Claim Your 30% ITC', intent: 'informational', priority: 2, searchVolume: 'high', competition: 'medium' },
    { topic: 'How Solar Net Metering Works: State-by-State Guide', intent: 'informational', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'Solar Battery Storage: Tesla Powerwall vs Alternatives Compared', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
    // Supporting content
    { topic: 'Solar Panel Maintenance: Complete Care Guide for Homeowners', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
    { topic: 'Common Solar Panel Problems and How to Fix Them', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
    { topic: 'How Long Do Solar Panels Last? Lifespan and Degradation Facts', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },
  ],
  roofing: [
    { topic: 'Roof Replacement Cost 2024: Price by Material and Size', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
    { topic: 'How Much Does a New Roof Cost? Complete Pricing Breakdown', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
    { topic: 'Metal Roof Cost vs Shingles: Which Is Worth the Investment?', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'medium' },
    { topic: 'Asphalt vs Metal Roofing: 10-Year Cost Comparison', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
    { topic: 'Best Roofing Materials 2024: Durability, Cost, and Climate Guide', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
    { topic: 'Architectural Shingles vs 3-Tab: Differences and Costs', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: '10 Signs Your Roof Needs Replacement (Not Just Repair)', intent: 'informational', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'Roof Leak Repair: DIY Fixes vs When to Call a Pro', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },
    { topic: 'Storm Damage Roof Inspection: What Insurance Covers', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },
    { topic: 'How Long Does a Roof Last? Lifespan by Material Type', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },
    { topic: "Roof Warranty Guide: What's Actually Covered?", intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
    { topic: 'How to Choose a Roofing Contractor: 15 Questions to Ask', intent: 'transactional', priority: 2, searchVolume: 'medium', competition: 'low' },
  ],
  hvac: [
    { topic: 'New HVAC System Cost 2024: AC, Furnace, and Heat Pump Prices', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
    { topic: 'How Much Does AC Replacement Cost? Pricing by Unit Size', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high', seasonality: 'summer' },
    { topic: 'Furnace Replacement Cost: Gas vs Electric Comparison', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'medium', seasonality: 'winter' },
    { topic: 'Heat Pump vs Central Air: Which Saves More Money?', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
    { topic: 'Mini Split vs Central Air: Cost and Efficiency Comparison', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'Best HVAC Brands 2024: Carrier vs Trane vs Lennox', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
    { topic: 'Signs Your HVAC System Needs Replacement: 8 Red Flags', intent: 'informational', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'AC Not Cooling? 10 Troubleshooting Steps Before Calling a Pro', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low', seasonality: 'summer' },
    { topic: 'Furnace Not Heating: Common Causes and Fixes', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low', seasonality: 'winter' },
    { topic: 'HVAC Maintenance Checklist: Seasonal Care Guide', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
    { topic: 'SEER Rating Explained: What It Means for Your Energy Bills', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
    { topic: 'How to Size an HVAC System: BTU Calculator Guide', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
  ],
  windows: [
    { topic: 'Window Replacement Cost 2024: Prices by Type and Material', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
    { topic: 'How Much Do New Windows Cost? Price Per Window Breakdown', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
    { topic: 'Pella vs Andersen vs Marvin: Window Brand Comparison', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
    { topic: 'Double Pane vs Triple Pane Windows: Is It Worth the Upgrade?', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'Vinyl vs Fiberglass vs Wood Windows: Complete Comparison', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'Replacement Windows vs New Construction: Which Do You Need?', intent: 'informational', priority: 2, searchVolume: 'low', competition: 'low' },
    { topic: 'Signs You Need New Windows: 7 Warning Signals', intent: 'informational', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'Foggy Windows Between Panes: Causes and Solutions', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
    { topic: 'Drafty Windows: Fix or Replace? Decision Guide', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
    { topic: 'Window Energy Efficiency Ratings Explained: U-Factor and SHGC', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
    { topic: 'Best Windows for Cold Climates vs Hot Climates', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
    { topic: 'Window Installation: DIY vs Professional Cost Comparison', intent: 'commercial', priority: 3, searchVolume: 'low', competition: 'low' },
  ],
  plumbing: [
    { topic: 'Plumber Cost 2024: Average Rates and Service Prices', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
    { topic: 'Water Heater Replacement Cost: Tank vs Tankless Prices', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'medium' },
    { topic: 'Whole House Repiping Cost: PEX vs Copper Pricing', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'Tankless vs Tank Water Heater: 10-Year Cost Analysis', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
    { topic: 'PEX vs Copper Pipes: Which Is Better for Your Home?', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'Best Water Heater Brands 2024: Rheem vs AO Smith vs Bradford', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'Signs of a Slab Leak: 8 Warning Signs and Detection Tips', intent: 'informational', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'Low Water Pressure: Causes and How to Fix It', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },
    { topic: 'Drain Clog: DIY Solutions vs When to Call a Plumber', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },
    { topic: 'How Long Do Water Heaters Last? Replacement Timeline', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
    { topic: 'Plumbing Emergency: What to Do Before the Plumber Arrives', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
    { topic: 'Water Softener vs Water Filter: Which Do You Need?', intent: 'commercial', priority: 3, searchVolume: 'low', competition: 'low' },
  ],
  electrical: [
    { topic: 'Electrician Cost 2024: Average Hourly Rates and Service Prices', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'high' },
    { topic: 'Electrical Panel Upgrade Cost: 100 to 200 Amp Pricing', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'medium' },
    { topic: 'EV Charger Installation Cost: Level 2 Home Charging Guide', intent: 'commercial', priority: 1, searchVolume: 'high', competition: 'medium' },
    { topic: 'GFCI vs AFCI Outlets: Where You Need Each Type', intent: 'informational', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'Solar Panel Electrical Requirements: Panel Upgrade Guide', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'Whole House Generator vs Portable: Cost and Sizing Guide', intent: 'commercial', priority: 2, searchVolume: 'medium', competition: 'medium' },
    { topic: 'Signs of Electrical Problems: 10 Warning Signs in Your Home', intent: 'informational', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'Flickering Lights: Causes and When to Call an Electrician', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },
    { topic: 'Circuit Breaker Keeps Tripping: Causes and Solutions', intent: 'informational', priority: 3, searchVolume: 'medium', competition: 'low' },
    { topic: 'How to Choose an Electrician: License, Insurance, Questions', intent: 'transactional', priority: 2, searchVolume: 'medium', competition: 'low' },
    { topic: 'Electrical Code Requirements 2024: What Homeowners Should Know', intent: 'informational', priority: 3, searchVolume: 'low', competition: 'low' },
    { topic: 'Smart Home Electrical: Wiring Requirements and Costs', intent: 'commercial', priority: 3, searchVolume: 'low', competition: 'low' },
  ],
};

// Legacy format for backwards compatibility
const BLOG_TOPICS: Record<string, string[]> = Object.fromEntries(
  Object.entries(BLOG_TOPICS_WITH_META).map(([cat, topics]) => [cat, topics.map(t => t.topic)])
);

// =============================================================================
// IMAGE STRATEGY
// =============================================================================

interface ImageConfig {
  heroImage: string;           // Main featured image
  thumbnailImage: string;      // For cards/listings
  ogImage: string;            // Social sharing
  contentImages: string[];    // In-article images
}

/**
 * Image keywords for Unsplash API by category
 */
const IMAGE_KEYWORDS: Record<string, string[]> = {
  solar: ['solar panels roof', 'solar installation', 'solar energy home', 'residential solar', 'solar technician'],
  roofing: ['roof shingles', 'roofing contractor', 'new roof house', 'roof repair', 'roofing materials'],
  hvac: ['air conditioning unit', 'hvac technician', 'furnace installation', 'heat pump', 'home cooling'],
  windows: ['window installation', 'new windows house', 'window replacement', 'energy efficient windows', 'home windows'],
  plumbing: ['plumber working', 'water heater', 'plumbing repair', 'bathroom plumbing', 'pipe installation'],
  electrical: ['electrician working', 'electrical panel', 'home wiring', 'ev charger home', 'electrical installation'],
};

/**
 * Get Unsplash image URL for a topic
 * Uses Unsplash Source API (no auth needed for basic usage)
 */
function getUnsplashImageUrl(category: string, width: number = 1200, height: number = 630): string {
  const keywords = IMAGE_KEYWORDS[category] || ['home improvement'];
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(keyword)}`;
}

/**
 * Generate image configuration for a blog post
 */
function generateImageConfig(category: string, topic: string): ImageConfig {
  // For production, you'd want to:
  // 1. Use Unsplash API to get specific images
  // 2. Download and host images locally
  // 3. Or use a service like Cloudinary for optimization

  const baseKeyword = IMAGE_KEYWORDS[category]?.[0] || 'home improvement';

  return {
    heroImage: `https://source.unsplash.com/1200x630/?${encodeURIComponent(baseKeyword)}`,
    thumbnailImage: `https://source.unsplash.com/400x300/?${encodeURIComponent(baseKeyword)}`,
    ogImage: `https://source.unsplash.com/1200x630/?${encodeURIComponent(baseKeyword)}`,
    contentImages: [
      `https://source.unsplash.com/800x500/?${encodeURIComponent(baseKeyword)}`,
    ],
  };
}

/**
 * Note: For production, consider:
 * 1. Unsplash API with API key for better quality/attribution
 * 2. AI image generation (DALL-E, Midjourney API)
 * 3. Stock photo services (Shutterstock API, Getty)
 * 4. Custom graphics generation (Canva API, Figma)
 */

// Example usage and CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    console.log(`
MyHomeQuoter Content Generation Script

Usage:
  npx tsx scripts/generate-content.ts --niche <niche> --state <state> --city <city>
  npx tsx scripts/generate-content.ts --article --niche <niche> --topic "<topic>"
  npx tsx scripts/generate-content.ts --blog --category <category> --topic "<topic>"
  npx tsx scripts/generate-content.ts --blog --category <category> --batch <count>
  npx tsx scripts/generate-content.ts --blog --category <category> --smart <count>
  npx tsx scripts/generate-content.ts --blog --list-topics

Options:
  --niche       Service niche (solar, roofing, hvac, etc.)
  --state       State code (TX, CA, FL, etc.)
  --city        City name
  --article     Generate article instead of landing page
  --blog        Generate a blog post for the content collection
  --category    Blog category (solar, roofing, hvac, windows, plumbing, electrical)
  --topic       Article/blog topic (required for --article or single --blog)
  --batch       Generate multiple blog posts sequentially from predefined list
  --smart       Smart selection: prioritizes gaps, balances intents, sorts by SEO value
  --featured    Mark the blog post as featured
  --list-topics Show suggested topics for each category with metadata
  --dry-run     Show generated content without saving

Examples:
  npx tsx scripts/generate-content.ts --niche solar --state TX --city Houston
  npx tsx scripts/generate-content.ts --article --niche roofing --topic "How to choose a roofing contractor"
  npx tsx scripts/generate-content.ts --blog --category solar --topic "Solar Panel Cost Guide 2024"
  npx tsx scripts/generate-content.ts --blog --category hvac --batch 3
  npx tsx scripts/generate-content.ts --blog --category solar --smart 5  # Smart selection
  npx tsx scripts/generate-content.ts --blog --list-topics
    `);
    return;
  }

  const getArg = (name: string): string | undefined => {
    const index = args.indexOf(`--${name}`);
    return index > -1 ? args[index + 1] : undefined;
  };

  const isArticle = args.includes('--article');
  const isBlog = args.includes('--blog');
  const listTopics = args.includes('--list-topics');
  const dryRun = args.includes('--dry-run');
  const featured = args.includes('--featured');

  // Map niche/category slugs to display names
  const nicheNames: Record<string, string> = {
    solar: 'Solar Panels',
    roofing: 'Roofing',
    hvac: 'HVAC',
    windows: 'Windows & Doors',
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    masonry: 'Masonry',
    siding: 'Siding',
    insulation: 'Insulation',
    gutters: 'Gutters',
  };

  const stateNames: Record<string, string> = {
    TX: 'Texas',
    CA: 'California',
    FL: 'Florida',
    NY: 'New York',
    // Add more as needed
  };

  // Handle --list-topics
  if (listTopics) {
    console.log('\n📝 Suggested Blog Topics by Category (with SEO metadata):\n');
    for (const [cat, topics] of Object.entries(BLOG_TOPICS_WITH_META)) {
      const existingPosts = getExistingPosts();
      console.log(`\n${nicheNames[cat] || cat}:`);
      topics.forEach((t, i) => {
        const slug = t.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const exists = existingPosts.includes(slug);
        const intentEmoji = t.intent === 'transactional' ? '💰' : t.intent === 'commercial' ? '🔍' : '📚';
        const priorityStars = '⭐'.repeat(4 - t.priority);
        const status = exists ? '✅' : '  ';
        console.log(`  ${status} ${i + 1}. ${intentEmoji} ${t.topic}`);
        console.log(`       Priority: ${priorityStars} | Volume: ${t.searchVolume} | Competition: ${t.competition}`);
      });
    }
    console.log('\n✅ = Already generated');
    console.log('💰 = Transactional | 🔍 = Commercial | 📚 = Informational');
    console.log('\nUsage: npx tsx scripts/generate-content.ts --blog --category solar --smart 5');
    return;
  }

  // Handle --blog
  if (isBlog) {
    const category = getArg('category');
    if (!category) {
      console.error('Error: --category is required for blog posts');
      console.error('Available categories: solar, roofing, hvac, windows, plumbing, electrical');
      process.exit(1);
    }

    const categoryName = nicheNames[category] || category;
    const batchCount = getArg('batch');
    const smartCount = getArg('smart');

    // Smart selection mode
    if (smartCount) {
      const count = parseInt(smartCount, 10);
      const selectedTopics = selectSmartTopics(category, count, { balanceIntents: true });

      if (selectedTopics.length === 0) {
        console.log('No topics available. All predefined topics have been generated.');
        return;
      }

      printTopicSelectionReport(selectedTopics, category);

      console.log(`\n🚀 Generating ${selectedTopics.length} blog posts for ${categoryName} (Smart Mode)...\n`);

      for (let i = 0; i < selectedTopics.length; i++) {
        const topicMeta = selectedTopics[i];
        console.log(`\n[${i + 1}/${selectedTopics.length}] Generating: "${topicMeta.topic}"...`);
        console.log(`   Intent: ${topicMeta.intent.toUpperCase()} | Priority: ${topicMeta.priority} | Volume: ${topicMeta.searchVolume}`);

        try {
          const content = await generateBlogPost({
            category,
            categoryName,
            topic: topicMeta.topic,
            targetKeywords: [
              category,
              categoryName.toLowerCase(),
              topicMeta.topic.toLowerCase().split(' ').slice(0, 3).join(' '),
            ],
            featured: topicMeta.priority === 1,
          });

          // Score the content quality
          const qualityScore = scoreContentQuality(content, category);
          printQualityReport(qualityScore);

          // Generate image config
          const imageConfig = generateImageConfig(category, topicMeta.topic);
          console.log(`\n🖼️ Image suggestions:`);
          console.log(`   Hero: ${imageConfig.heroImage}`);

          const markdown = createBlogPostMarkdown(content, category, topicMeta.priority === 1);

          if (dryRun) {
            console.log('\n--- Generated Content Preview ---');
            console.log(markdown.slice(0, 1000) + '...\n');
          } else {
            if (qualityScore.overall < 50) {
              console.warn(`⚠️ Content quality score too low (${qualityScore.overall}/100). Consider regenerating.`);
            }
            const slug = topicMeta.topic
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
            await saveBlogPost(slug, markdown);
          }

          // Delay between API calls
          if (i < selectedTopics.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error(`Error generating "${topicMeta.topic}":`, error);
        }
      }

      console.log('\n✅ Smart generation complete!');
      return;
    }

    if (batchCount) {
      // Batch generation (legacy mode)
      const count = parseInt(batchCount, 10);
      const availableTopics = BLOG_TOPICS[category] || [];

      if (availableTopics.length === 0) {
        console.error(`Error: No predefined topics for category "${category}"`);
        process.exit(1);
      }

      console.log(`\n🚀 Generating ${count} blog posts for ${categoryName}...\n`);

      for (let i = 0; i < Math.min(count, availableTopics.length); i++) {
        const topic = availableTopics[i];
        console.log(`\n[${i + 1}/${count}] Generating: "${topic}"...`);

        try {
          const content = await generateBlogPost({
            category,
            categoryName,
            topic,
            targetKeywords: [
              category,
              categoryName.toLowerCase(),
              topic.toLowerCase().split(' ').slice(0, 3).join(' '),
            ],
            featured: i === 0, // First post is featured
          });

          // Score the content quality
          const qualityScore = scoreContentQuality(content, category);
          printQualityReport(qualityScore);

          const markdown = createBlogPostMarkdown(content, category, i === 0);

          if (dryRun) {
            console.log('\n--- Generated Content Preview ---');
            console.log(markdown.slice(0, 1000) + '...\n');
          } else {
            // Only save if quality score is above threshold
            if (qualityScore.overall < 50) {
              console.warn(`⚠️ Content quality score too low (${qualityScore.overall}/100). Consider regenerating.`);
            }
            const slug = topic
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
            await saveBlogPost(slug, markdown);
          }

          // Small delay between API calls
          if (i < count - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay for better rate limiting
          }
        } catch (error) {
          console.error(`Error generating "${topic}":`, error);
        }
      }
    } else {
      // Single blog post
      const topic = getArg('topic');
      if (!topic) {
        console.error('Error: --topic is required for single blog posts');
        console.error('Or use --batch <count> to generate multiple posts');
        process.exit(1);
      }

      console.log(`\n📝 Generating blog post: "${topic}" (${categoryName})...`);
      console.log(`   Search Intent: ${analyzeSearchIntent(topic).toUpperCase()}`);
      console.log(`   Featured: ${featured ? 'Yes' : 'No'}\n`);

      const content = await generateBlogPost({
        category,
        categoryName,
        topic,
        targetKeywords: [
          category,
          categoryName.toLowerCase(),
          topic.toLowerCase().split(' ').slice(0, 3).join(' '),
        ],
        featured,
      });

      // Score the content quality
      const qualityScore = scoreContentQuality(content, category);
      printQualityReport(qualityScore);

      const markdown = createBlogPostMarkdown(content, category, featured);

      if (dryRun) {
        console.log('\n--- Generated Content ---');
        console.log(markdown);
      } else {
        if (qualityScore.overall < 50) {
          console.warn(`\n⚠️ Content quality score is low (${qualityScore.overall}/100).`);
          console.warn('Consider regenerating with --dry-run first to review.');
        }
        const slug = topic
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        await saveBlogPost(slug, markdown);
        console.log(`\n📄 Title: ${content.title}`);
        console.log(`📖 Reading time: ${content.readingTime} minutes`);
        console.log(`🏷️ Tags: ${content.tags.join(', ')}`);
      }
    }

    console.log('\n✅ Done!');
    return;
  }

  // Handle --article or landing page (existing logic)
  const niche = getArg('niche');

  if (!niche) {
    console.error('Error: --niche is required');
    process.exit(1);
  }

  const nicheName = nicheNames[niche] || niche;

  if (isArticle) {
    const topic = getArg('topic');
    if (!topic) {
      console.error('Error: --topic is required for articles');
      process.exit(1);
    }

    console.log(`Generating article: "${topic}" for ${nicheName}...`);

    const content = await generateArticleContent(niche, nicheName, topic, [
      nicheName.toLowerCase(),
      `${nicheName.toLowerCase()} tips`,
      `best ${nicheName.toLowerCase()}`,
    ]);

    if (dryRun) {
      console.log(JSON.stringify(content, null, 2));
    } else {
      const slug = topic
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      await saveContent('article', `${niche}-${slug}`, content);
    }
  } else {
    const state = getArg('state')?.toUpperCase();
    const city = getArg('city');

    if (!state || !city) {
      console.error('Error: --state and --city are required for landing pages');
      process.exit(1);
    }

    const stateName = stateNames[state] || state;

    console.log(`Generating landing page: ${nicheName} in ${city}, ${state}...`);

    const content = await generateLandingPageContent({
      niche,
      nicheName,
      city,
      state,
      stateName,
    });

    if (dryRun) {
      console.log(JSON.stringify(content, null, 2));
    } else {
      const slug = `${niche}-${state.toLowerCase()}-${city.toLowerCase().replace(/\s+/g, '-')}`;
      await saveContent('landing', slug, content);
    }
  }

  console.log('Done!');
}

main().catch(console.error);
