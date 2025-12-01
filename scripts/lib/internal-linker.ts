/**
 * Internal Linking System for Blog Articles
 *
 * Ensures all articles have proper:
 * - CTA links to forms (/get-quotes/[category]/)
 * - Category page links (/[category]/)
 * - Pillar content links
 * - Related article links
 */

import * as fs from 'fs';
import * as path from 'path';

// Link templates for each category
export const LINK_TEMPLATES = {
  solar: {
    form: '/get-quotes/solar/',
    category: '/solar/',
    pillar: '/blog/complete-guide-home-solar-panels/',
    ctas: [
      '[Get Free Solar Quotes](/get-quotes/solar/)',
      '[Compare Solar Prices Now](/get-quotes/solar/)',
      '[Request Your Free Solar Estimate](/get-quotes/solar/)',
      '[See How Much You Can Save](/get-quotes/solar/)',
    ],
  },
  roofing: {
    form: '/get-quotes/roofing/',
    category: '/roofing/',
    pillar: '/blog/complete-roof-replacement-guide/',
    ctas: [
      '[Get Free Roofing Quotes](/get-quotes/roofing/)',
      '[Compare Roofing Prices](/get-quotes/roofing/)',
      '[Request Your Free Roof Estimate](/get-quotes/roofing/)',
      '[Find Local Roofers](/get-quotes/roofing/)',
    ],
  },
  hvac: {
    form: '/get-quotes/hvac/',
    category: '/hvac/',
    pillar: '/blog/complete-hvac-guide/',
    ctas: [
      '[Get Free HVAC Quotes](/get-quotes/hvac/)',
      '[Compare HVAC Prices](/get-quotes/hvac/)',
      '[Request Your Free HVAC Estimate](/get-quotes/hvac/)',
      '[Find HVAC Contractors](/get-quotes/hvac/)',
    ],
  },
};

// Cluster articles for each category
export const CLUSTER_ARTICLES: Record<string, { slug: string; title: string }[]> = {
  solar: [
    { slug: 'solar-panel-cost-guide', title: 'Solar Panel Cost Guide' },
    { slug: 'solar-installation-process', title: 'Solar Installation Process' },
    { slug: 'solar-tax-credit-guide', title: 'Solar Tax Credit Guide' },
    { slug: 'solar-panel-roi-calculator', title: 'Solar ROI Calculator' },
    { slug: 'best-solar-panels-2024', title: 'Best Solar Panels 2024' },
  ],
  roofing: [
    { slug: 'roof-replacement-cost-guide', title: 'Roof Replacement Cost Guide' },
    { slug: 'metal-roof-vs-shingles', title: 'Metal Roof vs Shingles' },
    { slug: 'best-roofing-materials', title: 'Best Roofing Materials' },
    { slug: 'roof-repair-vs-replace', title: 'Roof Repair vs Replace' },
    { slug: 'roofing-contractor-guide', title: 'How to Choose a Roofer' },
  ],
  hvac: [
    { slug: 'hvac-system-cost-guide', title: 'HVAC System Cost Guide' },
    { slug: 'ac-replacement-guide', title: 'AC Replacement Guide' },
    { slug: 'furnace-replacement-guide', title: 'Furnace Replacement Guide' },
    { slug: 'heat-pump-vs-ac', title: 'Heat Pump vs AC' },
    { slug: 'hvac-maintenance-guide', title: 'HVAC Maintenance Guide' },
  ],
};

interface LinkAnalysis {
  hasFormLink: boolean;
  hasCategoryLink: boolean;
  hasPillarLink: boolean;
  hasClusterLinks: boolean;
  formLinkCount: number;
  internalLinkCount: number;
  missingLinks: string[];
}

/**
 * Analyze an article for internal links
 */
export function analyzeLinks(content: string, category: string): LinkAnalysis {
  const templates = LINK_TEMPLATES[category as keyof typeof LINK_TEMPLATES];
  if (!templates) {
    return {
      hasFormLink: false,
      hasCategoryLink: false,
      hasPillarLink: false,
      hasClusterLinks: false,
      formLinkCount: 0,
      internalLinkCount: 0,
      missingLinks: ['Unknown category'],
    };
  }

  const formLinkRegex = new RegExp(`\\(/get-quotes/${category}/\\)`, 'g');
  const categoryLinkRegex = new RegExp(`\\(/${category}/\\)`, 'g');
  const pillarLinkRegex = new RegExp(templates.pillar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const blogLinkRegex = /\(\/blog\/[^)]+\)/g;

  const formMatches = content.match(formLinkRegex) || [];
  const categoryMatches = content.match(categoryLinkRegex) || [];
  const pillarMatches = content.match(pillarLinkRegex) || [];
  const blogMatches = content.match(blogLinkRegex) || [];

  const missingLinks: string[] = [];

  if (formMatches.length < 2) {
    missingLinks.push(`Need ${2 - formMatches.length} more CTA links to /get-quotes/${category}/`);
  }
  if (categoryMatches.length === 0) {
    missingLinks.push(`Missing link to /${category}/`);
  }
  if (pillarMatches.length === 0 && !content.includes('silo: pillar')) {
    missingLinks.push(`Missing link to pillar: ${templates.pillar}`);
  }
  if (blogMatches.length < 2) {
    missingLinks.push(`Need more internal blog links (currently ${blogMatches.length})`);
  }

  return {
    hasFormLink: formMatches.length > 0,
    hasCategoryLink: categoryMatches.length > 0,
    hasPillarLink: pillarMatches.length > 0,
    hasClusterLinks: blogMatches.length >= 2,
    formLinkCount: formMatches.length,
    internalLinkCount: formMatches.length + categoryMatches.length + blogMatches.length,
    missingLinks,
  };
}

/**
 * Generate CTA block for a category
 */
export function generateCTABlock(category: string, style: 'inline' | 'box' = 'box'): string {
  const templates = LINK_TEMPLATES[category as keyof typeof LINK_TEMPLATES];
  if (!templates) return '';

  const cta = templates.ctas[Math.floor(Math.random() * templates.ctas.length)];

  if (style === 'box') {
    return `
> **Ready to get started?** ${cta} and compare prices from top-rated local contractors. It's free, fast, and there's no obligation.
`;
  }

  return cta;
}

/**
 * Generate related articles section
 */
export function generateRelatedArticles(category: string, currentSlug: string): string {
  const clusters = CLUSTER_ARTICLES[category as keyof typeof CLUSTER_ARTICLES];
  if (!clusters) return '';

  const related = clusters
    .filter(c => c.slug !== currentSlug)
    .slice(0, 3);

  if (related.length === 0) return '';

  let section = '\n## Related Articles\n\n';
  section += 'Learn more about ' + category + ':\n\n';
  related.forEach(article => {
    section += `- [${article.title}](/blog/${article.slug}/)\n`;
  });

  return section;
}

/**
 * Add missing links to article content
 */
export function addMissingLinks(content: string, category: string, siloType: string): string {
  const analysis = analyzeLinks(content, category);
  let updatedContent = content;

  // Add CTA after introduction if missing
  if (analysis.formLinkCount < 2) {
    const ctaBlock = generateCTABlock(category, 'box');

    // Find first H2 and insert CTA before it
    const firstH2Index = updatedContent.indexOf('\n## ');
    if (firstH2Index > 0) {
      updatedContent =
        updatedContent.slice(0, firstH2Index) +
        '\n' + ctaBlock + '\n' +
        updatedContent.slice(firstH2Index);
    }
  }

  // Add related articles section if missing cluster links
  if (!analysis.hasClusterLinks && siloType !== 'supporting') {
    const relatedSection = generateRelatedArticles(category, '');
    // Add before FAQ section if exists, otherwise at end
    const faqIndex = updatedContent.search(/## .*FAQ|## .*Questions/i);
    if (faqIndex > 0) {
      updatedContent =
        updatedContent.slice(0, faqIndex) +
        relatedSection + '\n' +
        updatedContent.slice(faqIndex);
    } else {
      updatedContent += '\n' + relatedSection;
    }
  }

  return updatedContent;
}

/**
 * Get silo status for all categories
 */
export function getSiloStatus(blogDir: string): Record<string, { pillar: boolean; clusters: number; supporting: number }> {
  const status: Record<string, { pillar: boolean; clusters: number; supporting: number }> = {
    solar: { pillar: false, clusters: 0, supporting: 0 },
    roofing: { pillar: false, clusters: 0, supporting: 0 },
    hvac: { pillar: false, clusters: 0, supporting: 0 },
  };

  if (!fs.existsSync(blogDir)) return status;

  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(blogDir, file), 'utf-8');

    // Extract category and silo from frontmatter
    const categoryMatch = content.match(/category:\s*(solar|roofing|hvac)/i);
    const siloMatch = content.match(/silo:\s*(pillar|cluster|supporting)/i);

    if (categoryMatch) {
      const cat = categoryMatch[1].toLowerCase();
      const silo = siloMatch ? siloMatch[1].toLowerCase() : 'supporting';

      if (silo === 'pillar') status[cat].pillar = true;
      else if (silo === 'cluster') status[cat].clusters++;
      else status[cat].supporting++;
    }
  }

  return status;
}

/**
 * Print silo status report
 */
export function printSiloReport(blogDir: string): void {
  const status = getSiloStatus(blogDir);

  console.log('\n📊 SILO STATUS REPORT');
  console.log('═'.repeat(50));

  for (const [cat, data] of Object.entries(status)) {
    const pillarIcon = data.pillar ? '✅' : '❌';
    const clusterStatus = `${data.clusters}/5`;
    const supportingStatus = `${data.supporting}/10`;

    console.log(`${cat.toUpperCase().padEnd(10)} Pillar: ${pillarIcon} | Clusters: ${clusterStatus} | Supporting: ${supportingStatus}`);
  }

  console.log('═'.repeat(50));

  // Recommendations
  console.log('\n📋 PRIORITIES:');
  let priority = 1;
  for (const [cat, data] of Object.entries(status)) {
    if (!data.pillar) {
      console.log(`${priority}. Create ${cat.toUpperCase()} pillar content`);
      priority++;
    }
  }
  for (const [cat, data] of Object.entries(status)) {
    if (data.clusters < 3) {
      console.log(`${priority}. Add ${3 - data.clusters} more ${cat} cluster articles`);
      priority++;
    }
  }
}
