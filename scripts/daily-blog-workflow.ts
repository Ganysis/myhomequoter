#!/usr/bin/env npx tsx
/**
 * Daily Blog Workflow - MyHomeQuoter
 *
 * Complete automation script that:
 * 1. Analyzes silo gaps
 * 2. Generates articles based on priorities
 * 3. Validates quality (≥80)
 * 4. Builds the site
 * 5. Deploys to Cloudflare Pages
 *
 * Usage:
 *   npx tsx scripts/daily-blog-workflow.ts                    # Full workflow (5 articles)
 *   npx tsx scripts/daily-blog-workflow.ts --count 3          # Generate 3 articles
 *   npx tsx scripts/daily-blog-workflow.ts --analyze          # Show silo gaps only
 *   npx tsx scripts/daily-blog-workflow.ts --no-deploy        # Skip deployment
 *   npx tsx scripts/daily-blog-workflow.ts --category solar   # Focus on solar
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { printSiloReport, getSiloStatus } from './lib/internal-linker.js';

// Configuration
const DEFAULT_ARTICLE_COUNT = 5;
const PROJECT_ROOT = process.cwd();
const BLOG_DIR = path.join(PROJECT_ROOT, 'src', 'content', 'blog');
const CLOUDFLARE_PROJECT = 'myhomequoter';

interface WorkflowOptions {
  count: number;
  category?: string;
  siloType?: string;
  deploy: boolean;
  analyze: boolean;
  dryRun: boolean;
}

function parseArgs(): WorkflowOptions {
  const args = process.argv.slice(2);

  const getArg = (name: string): string | undefined => {
    const index = args.indexOf(`--${name}`);
    return index > -1 && args[index + 1] && !args[index + 1].startsWith('--')
      ? args[index + 1]
      : undefined;
  };

  return {
    count: parseInt(getArg('count') || String(DEFAULT_ARTICLE_COUNT), 10),
    category: getArg('category'),
    siloType: getArg('silo'),
    deploy: !args.includes('--no-deploy'),
    analyze: args.includes('--analyze'),
    dryRun: args.includes('--dry-run'),
  };
}

function runCommand(command: string, description: string): boolean {
  console.log(`\n📌 ${description}...`);
  console.log(`   Command: ${command}`);

  try {
    execSync(command, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      encoding: 'utf-8',
    });
    console.log(`   ✅ ${description} - SUCCESS`);
    return true;
  } catch (error) {
    console.error(`   ❌ ${description} - FAILED`);
    return false;
  }
}

function getExistingArticleCount(): number {
  if (!fs.existsSync(BLOG_DIR)) return 0;
  return fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md')).length;
}

async function main() {
  const options = parseArgs();
  const startTime = Date.now();

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('🚀 MYHOMEQUOTER - DAILY BLOG WORKFLOW');
  console.log('═'.repeat(60));
  console.log(`📅 Date: ${new Date().toISOString().split('T')[0]}`);
  console.log(`📝 Articles to generate: ${options.count}`);
  console.log(`🎯 Category filter: ${options.category || 'All'}`);
  console.log(`🏗️ Silo type: ${options.siloType || 'Auto (by priority)'}`);
  console.log(`🚀 Deploy: ${options.deploy ? 'Yes' : 'No'}`);
  console.log('═'.repeat(60));

  // Step 1: Analyze current silo structure
  console.log('\n📊 STEP 1: ANALYZING SILO STRUCTURE');
  console.log('─'.repeat(40));
  printSiloReport(BLOG_DIR);

  const initialCount = getExistingArticleCount();
  console.log(`\n📚 Current articles: ${initialCount}`);

  if (options.analyze) {
    console.log('\n✅ Analysis complete (--analyze mode, no generation)');
    return;
  }

  // Step 2: Determine what to generate based on gaps
  console.log('\n📋 STEP 2: DETERMINING PRIORITIES');
  console.log('─'.repeat(40));

  const siloStatus = getSiloStatus(BLOG_DIR);
  const priorities: string[] = [];

  // Priority 1: Missing pillars
  for (const [cat, data] of Object.entries(siloStatus)) {
    if (!data.pillar) {
      priorities.push(`${cat} pillar`);
    }
  }

  // Priority 2: Low cluster count
  for (const [cat, data] of Object.entries(siloStatus)) {
    if (data.clusters < 3) {
      priorities.push(`${cat} clusters (need ${3 - data.clusters} more)`);
    }
  }

  // Priority 3: Supporting content
  for (const [cat, data] of Object.entries(siloStatus)) {
    if (data.supporting < 5) {
      priorities.push(`${cat} supporting (need ${5 - data.supporting} more)`);
    }
  }

  console.log('Generation priorities:');
  priorities.slice(0, 5).forEach((p, i) => console.log(`  ${i + 1}. ${p}`));

  // Step 3: Generate articles
  console.log('\n📝 STEP 3: GENERATING ARTICLES');
  console.log('─'.repeat(40));

  let generateCmd = `npx tsx scripts/auto-generate-blog.ts --count ${options.count}`;
  if (options.category) generateCmd += ` --category ${options.category}`;
  if (options.siloType) generateCmd += ` --silo ${options.siloType}`;
  if (options.dryRun) generateCmd += ' --dry-run';

  const generateSuccess = runCommand(generateCmd, 'Generating articles');

  if (!generateSuccess && !options.dryRun) {
    console.error('\n❌ Article generation failed. Aborting workflow.');
    process.exit(1);
  }

  const finalCount = getExistingArticleCount();
  const generated = finalCount - initialCount;
  console.log(`\n📈 Articles generated: ${generated}`);

  if (options.dryRun) {
    console.log('\n✅ Dry run complete (no files saved)');
    return;
  }

  // Step 4: Build the site
  console.log('\n🔨 STEP 4: BUILDING SITE');
  console.log('─'.repeat(40));

  const buildSuccess = runCommand('npm run build', 'Building Astro site');

  if (!buildSuccess) {
    console.error('\n❌ Build failed. Please check for errors above.');
    console.log('Common issues:');
    console.log('  - Invalid frontmatter YAML');
    console.log('  - Missing required fields');
    console.log('  - Image URL issues');
    process.exit(1);
  }

  // Step 5: Deploy to Cloudflare
  if (options.deploy) {
    console.log('\n🚀 STEP 5: DEPLOYING TO CLOUDFLARE');
    console.log('─'.repeat(40));

    const deployCmd = `npx wrangler pages deploy dist --project-name=${CLOUDFLARE_PROJECT}`;
    const deploySuccess = runCommand(deployCmd, 'Deploying to Cloudflare Pages');

    if (!deploySuccess) {
      console.warn('\n⚠️ Deployment failed. You may need to run:');
      console.log('   npx wrangler login');
      console.log('   Then retry deployment manually:');
      console.log(`   ${deployCmd}`);
    }
  } else {
    console.log('\n⏭️ STEP 5: SKIPPING DEPLOYMENT (--no-deploy)');
  }

  // Final summary
  const duration = Math.round((Date.now() - startTime) / 1000);

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('✅ DAILY BLOG WORKFLOW COMPLETE');
  console.log('═'.repeat(60));
  console.log(`📝 Articles generated: ${generated}`);
  console.log(`📚 Total articles: ${finalCount}`);
  console.log(`⏱️ Duration: ${duration} seconds`);
  console.log(`🔨 Build: ${buildSuccess ? '✅ Success' : '❌ Failed'}`);

  if (options.deploy) {
    console.log(`🚀 Deployment: Attempted`);
    console.log(`🌐 URL: https://${CLOUDFLARE_PROJECT}.pages.dev`);
  }

  console.log('\n📊 Updated silo status:');
  printSiloReport(BLOG_DIR);

  console.log('\n📋 Next steps:');
  console.log('  - Run `/blog analyze` to see remaining gaps');
  console.log('  - Check site at https://' + CLOUDFLARE_PROJECT + '.pages.dev');
  console.log('═'.repeat(60));
}

main().catch(error => {
  console.error('Workflow failed:', error);
  process.exit(1);
});
