#!/usr/bin/env node

/**
 * Blog Generation Script for MyHomeQuoter
 *
 * Automatically generates high-quality SEO blog articles following the silo structure.
 *
 * Usage:
 *   node scripts/generate-blog.js [count] [category] [type] [--deploy]
 *
 * Examples:
 *   node scripts/generate-blog.js                    # Generate 5 articles (default distribution)
 *   node scripts/generate-blog.js 3 solar           # Generate 3 solar articles
 *   node scripts/generate-blog.js pillar            # Generate pillar content only
 *   node scripts/generate-blog.js 5 --deploy        # Generate 5 articles and deploy
 *   node scripts/generate-blog.js --analyze         # Analyze silo gaps without generating
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  QUALITY_THRESHOLD: 80,
  MIN_WORD_COUNT: 2500,
  TARGET_WORD_COUNT: 3000,
  MAX_REGENERATIONS: 2,
  BLOG_DIR: path.join(__dirname, '../src/content/blog'),

  // Category distribution (when generating multiple articles)
  CATEGORY_DISTRIBUTION: {
    5: { solar: 2, roofing: 2, hvac: 1 },
    3: { solar: 1, roofing: 1, hvac: 1 },
    default: (count) => ({
      solar: Math.ceil(count * 0.4),
      roofing: Math.ceil(count * 0.35),
      hvac: Math.floor(count * 0.25)
    })
  },

  // Silo structure priorities
  SILO_PRIORITY: ['pillar', 'cluster', 'supporting'],

  // Category-specific data
  CATEGORIES: {
    solar: {
      name: 'Solar',
      author: 'Sarah Mitchell, Energy Expert',
      cta: 'Get Free Solar Quotes',
      ctaLink: '/get-quotes/solar/',
      categoryLink: '/solar/',
      facts: {
        taxCredit: '30% ITC through 2032',
        avgCost: '$15,000-$35,000',
        costPerWatt: '$2.50-$3.50',
        payback: '6-10 years',
        systemSize: '6-12 kW'
      }
    },
    roofing: {
      name: 'Roofing',
      author: 'Mike Johnson, Roofing Specialist',
      cta: 'Get Free Roofing Quotes',
      ctaLink: '/get-quotes/roofing/',
      categoryLink: '/roofing/',
      facts: {
        asphaltCost: '$5,000-$12,000 (20-30 years)',
        metalCost: '$10,000-$25,000 (40-70 years)',
        tileCost: '$15,000-$45,000 (50-100 years)',
        costPerSqFt: '$4-$25'
      }
    },
    hvac: {
      name: 'HVAC',
      author: 'David Chen, HVAC Technician',
      cta: 'Get Free HVAC Quotes',
      ctaLink: '/get-quotes/hvac/',
      categoryLink: '/hvac/',
      facts: {
        acCost: '$3,500-$7,500',
        furnaceCost: '$2,500-$6,000',
        heatPumpCost: '$4,000-$8,000',
        fullSystemCost: '$7,000-$15,000',
        seerRange: '14-25'
      }
    }
  }
};

// Topic templates for each category and silo type
const TOPIC_TEMPLATES = {
  solar: {
    pillar: [
      'Complete Guide to Home Solar Panels in {year}',
      'Everything You Need to Know About Going Solar in {year}'
    ],
    cluster: [
      'Solar Panel Cost in {year}: Complete Pricing Guide',
      'Solar Battery Storage Guide: Costs & Benefits {year}',
      'Solar Tax Credits & Incentives Guide {year}',
      'Best Solar Panels for Your Home: {year} Comparison',
      'Solar Energy vs Traditional Electricity: Cost Analysis',
      'How Much Do Solar Panels Save? Real Numbers {year}'
    ],
    supporting: [
      '{number} Signs Your Home Is Perfect for Solar',
      'How to Choose a Solar Installer: {year} Checklist',
      'Solar Panel Maintenance: Complete Guide',
      'Net Metering Explained: Maximize Your Solar Savings',
      'Solar Panel Warranty Guide: What\'s Covered?',
      'Seasonal Solar Production: What to Expect'
    ]
  },
  roofing: {
    pillar: [
      'Complete Roof Replacement Guide for Homeowners {year}',
      'Everything About Residential Roofing in {year}'
    ],
    cluster: [
      'Roofing Materials Compared: Asphalt vs Metal vs Tile',
      'Roof Replacement Cost Guide {year}',
      '{number} Warning Signs You Need a New Roof',
      'Complete Roof Inspection Guide for Homeowners',
      'Metal Roofing vs Asphalt Shingles: Which Is Better?',
      'How Long Do Different Roof Types Last?'
    ],
    supporting: [
      'Best Time of Year to Replace Your Roof',
      'How to Choose a Roofing Contractor: {year} Tips',
      'Roof Ventilation: Why It Matters',
      'Roof Warranties Explained: What You Need to Know',
      'Storm Damage Roof Inspection Checklist',
      'Seasonal Roof Maintenance Guide'
    ]
  },
  hvac: {
    pillar: [
      'Complete HVAC Guide for Homeowners {year}',
      'Everything You Need to Know About Home HVAC Systems'
    ],
    cluster: [
      'HVAC System Sizing Guide: How to Choose the Right Size',
      'HVAC Replacement Cost Guide {year}',
      'Heat Pump vs Furnace: Complete Comparison {year}',
      'Central AC vs Mini-Split: Which Is Better?',
      'HVAC Maintenance Checklist: Seasonal Guide',
      'SEER Ratings Explained: What You Need to Know'
    ],
    supporting: [
      'Best Time to Replace Your HVAC System',
      'How to Choose an HVAC Contractor: {year} Guide',
      '{number} Signs Your HVAC Needs Replacement',
      'HVAC Filter Guide: Types and Replacement Schedule',
      'Smart Thermostat Buyer\'s Guide {year}',
      'Emergency HVAC Issues: When to Call a Pro'
    ]
  }
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  const params = {
    count: 5,
    category: null,
    siloType: null,
    deploy: false,
    analyze: false
  };

  args.forEach(arg => {
    if (arg === '--deploy') params.deploy = true;
    else if (arg === '--analyze') params.analyze = true;
    else if (arg === 'pillar' || arg === 'cluster' || arg === 'supporting') params.siloType = arg;
    else if (arg === 'solar' || arg === 'roofing' || arg === 'hvac') params.category = arg;
    else if (!isNaN(parseInt(arg))) params.count = parseInt(arg);
  });

  return params;
}

/**
 * Analyze existing blog content and identify gaps
 */
function analyzeSiloGaps() {
  const blogDir = CONFIG.BLOG_DIR;

  if (!fs.existsSync(blogDir)) {
    console.log('📁 Blog directory not found. Creating...');
    fs.mkdirSync(blogDir, { recursive: true });
    return { solar: [], roofing: [], hvac: [] };
  }

  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
  const analysis = {
    solar: { pillar: [], cluster: [], supporting: [] },
    roofing: { pillar: [], cluster: [], supporting: [] },
    hvac: { pillar: [], cluster: [], supporting: [] }
  };

  files.forEach(file => {
    const content = fs.readFileSync(path.join(blogDir, file), 'utf-8');
    const match = content.match(/category:\s*(solar|roofing|hvac)/);
    const siloMatch = content.match(/silo:\s*(pillar|cluster|supporting)/);
    const titleMatch = content.match(/title:\s*"(.+)"/);

    if (match && titleMatch) {
      const category = match[1];
      const silo = siloMatch ? siloMatch[1] : 'supporting';
      analysis[category][silo].push(titleMatch[1]);
    }
  });

  return analysis;
}

/**
 * Display silo analysis
 */
function displayAnalysis(analysis) {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 SILO STRUCTURE ANALYSIS');
  console.log('═══════════════════════════════════════════════════\n');

  ['solar', 'roofing', 'hvac'].forEach(category => {
    const cat = analysis[category];
    const pillarStatus = cat.pillar.length > 0 ? '✓' : '✗';

    console.log(`${CONFIG.CATEGORIES[category].name.toUpperCase()}:`);
    console.log(`  Pillar: ${pillarStatus} (${cat.pillar.length}/1)`);
    console.log(`  Clusters: ${cat.cluster.length}/5`);
    console.log(`  Supporting: ${cat.supporting.length}/10`);

    if (cat.pillar.length > 0) {
      console.log(`    ├─ ${cat.pillar[0]}`);
    }
    console.log('');
  });

  // Identify gaps
  console.log('🎯 PRIORITY GAPS:');
  const gaps = [];

  ['solar', 'roofing', 'hvac'].forEach(category => {
    if (analysis[category].pillar.length === 0) {
      gaps.push(`  1. CREATE ${category.toUpperCase()} PILLAR (Priority: CRITICAL)`);
    }
    if (analysis[category].cluster.length < 3) {
      gaps.push(`  2. Add ${3 - analysis[category].cluster.length} ${category} cluster articles`);
    }
  });

  if (gaps.length === 0) {
    console.log('  ✅ All critical content exists!');
  } else {
    gaps.forEach(gap => console.log(gap));
  }

  console.log('\n═══════════════════════════════════════════════════\n');
}

/**
 * Select topics based on gaps and priority
 */
function selectTopics(count, analysis, categoryFilter, siloFilter) {
  const topics = [];
  const currentYear = new Date().getFullYear();

  // Determine category distribution
  let distribution;
  if (categoryFilter) {
    distribution = { [categoryFilter]: count };
  } else if (CONFIG.CATEGORY_DISTRIBUTION[count]) {
    distribution = CONFIG.CATEGORY_DISTRIBUTION[count];
  } else {
    distribution = CONFIG.CATEGORY_DISTRIBUTION.default(count);
  }

  // Generate topics for each category
  Object.entries(distribution).forEach(([category, num]) => {
    for (let i = 0; i < num; i++) {
      // Determine silo type based on gaps
      let siloType;
      if (siloFilter) {
        siloType = siloFilter;
      } else if (analysis[category].pillar.length === 0) {
        siloType = 'pillar';
      } else if (analysis[category].cluster.length < 5) {
        siloType = 'cluster';
      } else {
        siloType = 'supporting';
      }

      // Select a topic template
      const templates = TOPIC_TEMPLATES[category][siloType];
      const template = templates[Math.floor(Math.random() * templates.length)];
      const title = template
        .replace('{year}', currentYear)
        .replace('{number}', Math.floor(Math.random() * 5) + 5);

      topics.push({
        category,
        siloType,
        title,
        slug: title.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      });
    }
  });

  return topics;
}

/**
 * Generate article content
 * Note: This is a placeholder. In production, you'd use Claude API or similar.
 */
function generateArticleContent(topic) {
  const currentYear = new Date().getFullYear();
  const currentDate = new Date().toISOString().split('T')[0];
  const category = CONFIG.CATEGORIES[topic.category];

  // This is a template - in production, you'd generate rich content here
  return `---
title: "${topic.title}"
description: "Comprehensive guide to ${topic.title.toLowerCase()}. Get expert insights, cost breakdowns, and actionable tips."
publishDate: ${currentDate}
author: "${category.author}"
category: ${topic.category}
tags: ["${topic.category}", "home improvement", "cost guide"]
image:
  src: "https://source.unsplash.com/1200x630/?${topic.category}"
  alt: "${topic.title}"
featured: ${topic.siloType === 'pillar'}
readingTime: 12
silo: ${topic.siloType}
---

# ${topic.title}

[This is a placeholder. In production, full article content would be generated here using Claude API or similar AI service.]

## Introduction

This comprehensive guide covers everything you need to know about ${topic.title.toLowerCase()}.

## Key Points

- Expert insights from ${category.author}
- Current ${currentYear} pricing and data
- Step-by-step guidance
- Real-world examples

## Get Started Today

Ready to move forward? **${category.cta}** from pre-screened professionals in your area.

[${category.cta} →](${category.ctaLink})

---

*Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}*
`;
}

/**
 * Save article to file
 */
function saveArticle(topic, content) {
  const filePath = path.join(CONFIG.BLOG_DIR, `${topic.slug}.md`);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`  ✅ Saved: ${topic.slug}.md`);
}

/**
 * Calculate quality score (simplified)
 */
function calculateQualityScore(content) {
  let score = 0;

  // Word count (20 pts)
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= CONFIG.MIN_WORD_COUNT) score += 20;
  else score += Math.floor((wordCount / CONFIG.MIN_WORD_COUNT) * 20);

  // Headings (15 pts)
  const h2Count = (content.match(/^## /gm) || []).length;
  score += Math.min(h2Count * 2.5, 15);

  // Tables (15 pts)
  const tableCount = (content.match(/\|.*\|/g) || []).length;
  score += Math.min(tableCount * 3, 15);

  // Internal links (15 pts)
  const linkCount = (content.match(/\[.*\]\(\/.*\)/g) || []).length;
  score += Math.min(linkCount * 5, 15);

  // SEO elements (15 pts)
  if (content.includes('title:')) score += 5;
  if (content.includes('description:')) score += 5;
  if (content.includes('tags:')) score += 5;

  // Engagement (20 pts)
  if (content.includes('Pro Tip')) score += 5;
  if (content.includes('FAQ') || content.includes('Questions')) score += 5;
  if (content.includes('**')) score += 5;
  if (content.includes('✅') || content.includes('❌')) score += 5;

  return Math.round(score);
}

/**
 * Build the site
 */
function buildSite() {
  console.log('\n🔨 Building site...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build successful!');
    return true;
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    return false;
  }
}

/**
 * Deploy to Cloudflare Pages
 */
function deploySite() {
  console.log('\n🚀 Deploying to Cloudflare Pages...');
  try {
    execSync('npx wrangler pages deploy dist --project-name=myhomequoter', { stdio: 'inherit' });
    console.log('✅ Deploy successful!');
    return true;
  } catch (error) {
    console.error('❌ Deploy failed:', error.message);
    console.log('💡 Try running: npx wrangler login');
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🤖 MyHomeQuoter Blog Generator');
  console.log('═══════════════════════════════════════════════════\n');

  const params = parseArgs();

  // Analyze existing content
  console.log('📊 Analyzing existing blog content...');
  const analysis = analyzeSiloGaps();

  if (params.analyze) {
    displayAnalysis(analysis);
    return;
  }

  // Select topics
  console.log(`📝 Selecting ${params.count} topics...`);
  const topics = selectTopics(params.count, analysis, params.category, params.siloType);

  console.log('\n📄 Generating articles:\n');
  const results = [];

  // Generate articles
  topics.forEach((topic, index) => {
    console.log(`${index + 1}. ${topic.title}`);
    console.log(`   Category: ${topic.category} | Silo: ${topic.siloType}`);

    const content = generateArticleContent(topic);
    saveArticle(topic, content);

    const quality = calculateQualityScore(content);
    results.push({ topic, quality });

    console.log(`   Quality: ${quality}/100 ${quality >= CONFIG.QUALITY_THRESHOLD ? '✅' : '⚠️'}`);
    console.log('');
  });

  // Summary
  const avgQuality = Math.round(results.reduce((sum, r) => sum + r.quality, 0) / results.length);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ GENERATION COMPLETE');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`📊 Total Articles: ${results.length}`);
  console.log(`📈 Average Quality: ${avgQuality}/100`);
  console.log('');

  // Build
  const buildSuccess = buildSite();

  // Deploy
  if (params.deploy && buildSuccess) {
    deploySite();
  }

  console.log('\n✨ Done!\n');
}

// Run
main().catch(console.error);
