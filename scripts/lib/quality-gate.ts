/**
 * Quality Gate for Blog Content
 *
 * Validates generated blog content meets quality standards before publishing.
 * Minimum score: 80/100
 */

export interface QualityScore {
  overall: number;
  passed: boolean;
  breakdown: {
    wordCount: { score: number; value: number; target: string; passed: boolean };
    headingStructure: { score: number; h2Count: number; h3Count: number; passed: boolean };
    dataElements: { score: number; tables: number; lists: number; passed: boolean };
    internalLinks: { score: number; count: number; passed: boolean };
    readability: { score: number; avgSentenceLength: number; passed: boolean };
    seoElements: { score: number; details: string[]; passed: boolean };
    engagement: { score: number; details: string[]; passed: boolean };
  };
  issues: string[];
  suggestions: string[];
}

export const QUALITY_THRESHOLD = 80;

/**
 * Score blog content quality
 * Returns score out of 100
 */
export function scoreContent(content: string, category: string): QualityScore {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // =========================================================================
  // WORD COUNT (20 points)
  // =========================================================================
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  let wordCountScore: number;
  let wordCountPassed: boolean;

  if (wordCount >= 2500) {
    wordCountScore = 20;
    wordCountPassed = true;
  } else if (wordCount >= 2000) {
    wordCountScore = 15;
    wordCountPassed = true;
  } else if (wordCount >= 1500) {
    wordCountScore = 10;
    wordCountPassed = false;
    issues.push(`Word count (${wordCount}) below target. Aim for 2500+.`);
  } else {
    wordCountScore = 5;
    wordCountPassed = false;
    issues.push(`Word count critically low (${wordCount}). Must be 2500+.`);
  }

  // =========================================================================
  // HEADING STRUCTURE (15 points)
  // =========================================================================
  const h2Matches = content.match(/^## /gm) || [];
  const h3Matches = content.match(/^### /gm) || [];
  const h2Count = h2Matches.length;
  const h3Count = h3Matches.length;

  let headingScore: number;
  let headingPassed: boolean;

  if (h2Count >= 6 && h3Count >= 4) {
    headingScore = 15;
    headingPassed = true;
  } else if (h2Count >= 5 && h3Count >= 2) {
    headingScore = 12;
    headingPassed = true;
  } else if (h2Count >= 4) {
    headingScore = 8;
    headingPassed = false;
    suggestions.push(`Add more H2 sections (currently ${h2Count}, aim for 6+).`);
  } else {
    headingScore = 4;
    headingPassed = false;
    issues.push(`Insufficient heading structure. Need 6+ H2 sections.`);
  }

  // =========================================================================
  // DATA ELEMENTS - Tables & Lists (15 points)
  // =========================================================================
  const tableLines = content.match(/\|.*\|/g) || [];
  const tables = Math.floor(tableLines.length / 3); // Approximate table count
  const bulletLists = (content.match(/^[-*]\s/gm) || []).length;
  const numberedLists = (content.match(/^\d+\.\s/gm) || []).length;
  const totalLists = bulletLists + numberedLists;

  let dataScore: number;
  let dataPassed: boolean;

  if (tables >= 2 && totalLists >= 15) {
    dataScore = 15;
    dataPassed = true;
  } else if (tables >= 1 && totalLists >= 10) {
    dataScore = 12;
    dataPassed = true;
  } else if (tables >= 1 || totalLists >= 8) {
    dataScore = 8;
    dataPassed = false;
    suggestions.push(`Add more data tables (${tables} found, aim for 2+).`);
  } else {
    dataScore = 4;
    dataPassed = false;
    issues.push(`Need data tables and lists for featured snippets.`);
  }

  // =========================================================================
  // INTERNAL LINKS (15 points)
  // =========================================================================
  const getQuotesLinks = (content.match(/\(\/get-quotes\//g) || []).length;
  const categoryLinks = (content.match(new RegExp(`\\(/${category}/`, 'g')) || []).length;
  const blogLinks = (content.match(/\(\/blog\//g) || []).length;
  const totalInternalLinks = getQuotesLinks + categoryLinks + blogLinks;

  let linkScore: number;
  let linkPassed: boolean;

  if (getQuotesLinks >= 1 && totalInternalLinks >= 4) {
    linkScore = 15;
    linkPassed = true;
  } else if (getQuotesLinks >= 1 && totalInternalLinks >= 2) {
    linkScore = 12;
    linkPassed = true;
  } else if (totalInternalLinks >= 1) {
    linkScore = 6;
    linkPassed = false;
    suggestions.push(`Add CTA link to /get-quotes/${category}/.`);
  } else {
    linkScore = 0;
    linkPassed = false;
    issues.push(`Missing internal links. Add /get-quotes/${category}/ CTA.`);
  }

  // =========================================================================
  // READABILITY (10 points)
  // =========================================================================
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const avgSentenceLength = sentences.length > 0
    ? Math.round(wordCount / sentences.length)
    : 50;

  let readabilityScore: number;
  let readabilityPassed: boolean;

  if (avgSentenceLength <= 18) {
    readabilityScore = 10;
    readabilityPassed = true;
  } else if (avgSentenceLength <= 22) {
    readabilityScore = 8;
    readabilityPassed = true;
  } else if (avgSentenceLength <= 28) {
    readabilityScore = 5;
    readabilityPassed = false;
    suggestions.push(`Sentences are long (avg ${avgSentenceLength} words). Break them up.`);
  } else {
    readabilityScore = 2;
    readabilityPassed = false;
    issues.push(`Sentences too long. Average should be under 20 words.`);
  }

  // =========================================================================
  // SEO ELEMENTS (15 points)
  // =========================================================================
  const seoDetails: string[] = [];
  let seoScore = 0;

  // FAQ section (4 points)
  const hasFAQ = /##.*FAQ|##.*Questions|##.*Frequently/i.test(content);
  if (hasFAQ) {
    seoScore += 4;
    seoDetails.push('✓ FAQ section');
  } else {
    issues.push('Missing FAQ section for People Also Ask optimization.');
  }

  // Pro Tips / Callouts (3 points)
  const hasProTip = />\s*\*?\*?(Pro Tip|Key Takeaway|Expert Tip|Important)/i.test(content);
  if (hasProTip) {
    seoScore += 3;
    seoDetails.push('✓ Pro tip callouts');
  } else {
    suggestions.push('Add Pro Tip callout boxes using > blockquotes.');
  }

  // Clear CTA (4 points)
  const hasCTA = /get.*quote|free.*quote|request.*quote|compare.*quote/i.test(content);
  if (hasCTA) {
    seoScore += 4;
    seoDetails.push('✓ Clear CTA');
  } else {
    issues.push('Missing clear call-to-action for lead generation.');
  }

  // Specific numbers/data (4 points)
  const hasNumbers = /\$[\d,]+|\d+%|\d+ (years?|months?|days?|hours?)/.test(content);
  if (hasNumbers) {
    seoScore += 4;
    seoDetails.push('✓ Specific numbers/data');
  } else {
    suggestions.push('Include specific prices, percentages, and timeframes.');
  }

  const seoPassed = seoScore >= 11;

  // =========================================================================
  // ENGAGEMENT ELEMENTS (10 points)
  // =========================================================================
  const engagementDetails: string[] = [];
  let engagementScore = 0;

  // Bold text for key terms (3 points)
  const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length;
  if (boldCount >= 10) {
    engagementScore += 3;
    engagementDetails.push('✓ Bold key terms');
  } else {
    suggestions.push(`Add more bold emphasis (${boldCount} found, aim for 10+).`);
  }

  // Comparison/contrast (3 points)
  const hasComparison = /vs\.?|versus|compared to|better than|worse than/i.test(content);
  if (hasComparison) {
    engagementScore += 3;
    engagementDetails.push('✓ Comparisons');
  }

  // Year/date relevance (2 points)
  const currentYear = new Date().getFullYear();
  const hasCurrentYear = content.includes(String(currentYear)) || content.includes(String(currentYear + 1));
  if (hasCurrentYear) {
    engagementScore += 2;
    engagementDetails.push('✓ Current year mentioned');
  } else {
    suggestions.push(`Add ${currentYear} to title or content for freshness.`);
  }

  // Cost section (2 points)
  const hasCostSection = /##.*cost|##.*price|##.*pricing/i.test(content);
  if (hasCostSection) {
    engagementScore += 2;
    engagementDetails.push('✓ Cost section');
  }

  const engagementPassed = engagementScore >= 6;

  // =========================================================================
  // CALCULATE OVERALL SCORE
  // =========================================================================
  const overall = wordCountScore + headingScore + dataScore + linkScore +
                  readabilityScore + seoScore + engagementScore;

  const passed = overall >= QUALITY_THRESHOLD;

  return {
    overall,
    passed,
    breakdown: {
      wordCount: {
        score: wordCountScore,
        value: wordCount,
        target: '2500+',
        passed: wordCountPassed
      },
      headingStructure: {
        score: headingScore,
        h2Count,
        h3Count,
        passed: headingPassed
      },
      dataElements: {
        score: dataScore,
        tables,
        lists: totalLists,
        passed: dataPassed
      },
      internalLinks: {
        score: linkScore,
        count: totalInternalLinks,
        passed: linkPassed
      },
      readability: {
        score: readabilityScore,
        avgSentenceLength,
        passed: readabilityPassed
      },
      seoElements: {
        score: seoScore,
        details: seoDetails,
        passed: seoPassed
      },
      engagement: {
        score: engagementScore,
        details: engagementDetails,
        passed: engagementPassed
      }
    },
    issues,
    suggestions
  };
}

/**
 * Print quality report to console
 */
export function printQualityReport(score: QualityScore): void {
  const getGrade = (s: number): string =>
    s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 70 ? 'C' : s >= 60 ? 'D' : 'F';

  const getColor = (s: number): string =>
    s >= 80 ? '\x1b[32m' : s >= 60 ? '\x1b[33m' : '\x1b[31m';

  const reset = '\x1b[0m';
  const passIcon = score.passed ? '✅' : '❌';

  console.log('\n📊 QUALITY GATE REPORT');
  console.log('═'.repeat(50));
  console.log(`${getColor(score.overall)}Overall: ${score.overall}/100 (${getGrade(score.overall)}) ${passIcon}${reset}`);
  console.log(`Threshold: ${QUALITY_THRESHOLD}/100`);
  console.log('');

  console.log('Breakdown:');
  const b = score.breakdown;
  console.log(`  📝 Word Count: ${b.wordCount.value} (${b.wordCount.score}/20) ${b.wordCount.passed ? '✓' : '✗'}`);
  console.log(`  📑 Headings: ${b.headingStructure.h2Count} H2, ${b.headingStructure.h3Count} H3 (${b.headingStructure.score}/15) ${b.headingStructure.passed ? '✓' : '✗'}`);
  console.log(`  📊 Data: ${b.dataElements.tables} tables, ${b.dataElements.lists} list items (${b.dataElements.score}/15) ${b.dataElements.passed ? '✓' : '✗'}`);
  console.log(`  🔗 Links: ${b.internalLinks.count} internal (${b.internalLinks.score}/15) ${b.internalLinks.passed ? '✓' : '✗'}`);
  console.log(`  📖 Readability: ${b.readability.avgSentenceLength} words/sentence (${b.readability.score}/10) ${b.readability.passed ? '✓' : '✗'}`);
  console.log(`  🎯 SEO: ${b.seoElements.details.join(', ') || 'None'} (${b.seoElements.score}/15) ${b.seoElements.passed ? '✓' : '✗'}`);
  console.log(`  💡 Engagement: ${b.engagement.details.join(', ') || 'None'} (${b.engagement.score}/10) ${b.engagement.passed ? '✓' : '✗'}`);

  if (score.issues.length > 0) {
    console.log('\n❌ Issues (must fix):');
    score.issues.forEach(issue => console.log(`  • ${issue}`));
  }

  if (score.suggestions.length > 0) {
    console.log('\n💡 Suggestions (optional):');
    score.suggestions.forEach(s => console.log(`  • ${s}`));
  }

  console.log('═'.repeat(50));
}

/**
 * Check if content passes quality gate
 */
export function passesQualityGate(content: string, category: string): boolean {
  const score = scoreContent(content, category);
  return score.passed;
}
