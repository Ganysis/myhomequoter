# Blog Generation Command - MyHomeQuoter

Generate high-quality SEO blog articles with automatic silo linking and deployment.

## Instructions

You are the Blog Generation Assistant for MyHomeQuoter. Execute this complete workflow:

### Parameters
- `$ARGUMENTS` may contain:
  - Number (1-10): articles to generate (default: 5)
  - Category: `solar`, `roofing`, `hvac`
  - Silo type: `pillar`, `cluster`, `supporting`
  - `deploy`: auto-deploy after build
  - `analyze`: show silo gaps without generating

Examples:
- `/blog` → Generate 5 articles (2 Solar, 2 Roofing, 1 HVAC)
- `/blog 3 solar` → Generate 3 Solar articles
- `/blog pillar` → Generate pillar content only
- `/blog deploy` → Generate 5 articles + build + deploy
- `/blog analyze` → Show what's missing in each silo

---

## Configuration

| Setting | Value |
|---------|-------|
| Quality Threshold | **80/100** minimum |
| Word Count | **2500-3000** words |
| Max Regenerations | **2** attempts |
| Categories | Solar (40%), Roofing (35%), HVAC (25%) |

---

## Complete Workflow

### Step 1: Analyze Silo Structure

Read ALL existing blog posts in `src/content/blog/` and create a gap analysis:

**SILO STRUCTURE (per category):**

```
PILLAR (1 per category) - Comprehensive guide
    ├── CLUSTER (3-5) - Deep-dive topics
    │   ├── Cost guides
    │   ├── Comparisons
    │   └── How-to guides
    └── SUPPORTING (5-10) - Long-tail content
        ├── FAQs
        ├── Tips articles
        └── Seasonal content
```

**Required Pillar Articles:**
- Solar: "Complete Guide to Home Solar Panels 2024"
- Roofing: "Complete Roof Replacement Guide 2024"
- HVAC: "Complete HVAC Guide for Homeowners 2024"

### Step 2: Select Topics by Priority

1. **Missing Pillars** (Priority 1) - Create these first!
2. **Cluster gaps** (Priority 2) - Support the pillars
3. **Supporting content** (Priority 3) - Long-tail traffic

Follow category distribution:
- 5 articles → 2 Solar, 2 Roofing, 1 HVAC
- 3 articles → 1 Solar, 1 Roofing, 1 HVAC

### Step 3: Generate Each Article

Create markdown in `src/content/blog/[slug].md`:

```markdown
---
title: "SEO Title with Primary Keyword | MyHomeQuoter"
description: "150-160 char meta description with keyword and CTA"
publishDate: YYYY-MM-DD
author: "Expert Name, XX-Year Industry Veteran"
category: solar|roofing|hvac
tags: ["primary-keyword", "secondary", "long-tail"]
image:
  src: "https://images.unsplash.com/[photo-id]?w=1200&h=630&fit=crop"
  alt: "Descriptive alt text with keyword"
featured: true|false
readingTime: X
silo: pillar|cluster|supporting
relatedPillar: "slug-of-pillar-article"
---

[Article content]
```

### Step 4: Internal Linking Rules

**CRITICAL - Every article MUST include:**

1. **CTA Link to Form** (at least 2x):
   ```markdown
   [Get Free Solar Quotes](/get-quotes/solar/)
   [Compare Roofing Prices](/get-quotes/roofing/)
   [Request HVAC Estimates](/get-quotes/hvac/)
   ```

2. **Link to Category Page** (1x):
   ```markdown
   [Learn more about solar](/solar/)
   [Explore roofing options](/roofing/)
   [HVAC solutions](/hvac/)
   ```

3. **Link to Pillar Content** (for cluster/supporting):
   ```markdown
   [Read our complete solar guide](/blog/complete-guide-home-solar-panels/)
   ```

4. **Link to Related Clusters** (2-3):
   ```markdown
   [Solar panel costs breakdown](/blog/solar-panel-cost-guide/)
   ```

**Placement Strategy:**
- First CTA: After introduction (within first 300 words)
- Second CTA: After main content, before FAQ
- Pillar link: In relevant sections
- Cluster links: Throughout where contextually appropriate

### Step 5: Content Quality Checklist

Before saving, verify each article:

- [ ] Word count ≥ 2500
- [ ] 6+ H2 headings with keywords
- [ ] 2+ data tables (costs, comparisons)
- [ ] FAQ section (5-7 questions)
- [ ] 2+ CTA links to `/get-quotes/[category]/`
- [ ] 1+ link to category page `/[category]/`
- [ ] 1+ link to pillar (if cluster/supporting)
- [ ] Pro Tip callout boxes using `> **Pro Tip:**`
- [ ] Specific numbers ($, %, years)
- [ ] Current year (2024/2025) in title or content

**Quality Score Components (100 total):**
- Word count: 20 pts
- Heading structure: 15 pts
- Data tables/lists: 15 pts
- Internal links: 15 pts
- Readability: 10 pts
- SEO elements: 15 pts
- Engagement: 10 pts

### Step 6: Save, Build, Deploy

1. **Save** each article to `src/content/blog/[slug].md`

2. **Build** the site:
   ```bash
   npm run build
   ```

3. **Deploy** (if `deploy` argument provided):
   ```bash
   npx wrangler pages deploy dist --project-name=myhomequoter
   ```

---

## Output Summary

After completion, provide:

```
═══════════════════════════════════════════════════
✅ BLOG GENERATION COMPLETE
═══════════════════════════════════════════════════

📊 SILO STATUS:
Solar:    Pillar ✓ | Clusters: 3/5 | Supporting: 2/10
Roofing:  Pillar ✗ | Clusters: 1/5 | Supporting: 0/10
HVAC:     Pillar ✓ | Clusters: 2/5 | Supporting: 1/10

📝 GENERATED ARTICLES:
1. [Title] - Solar/Cluster - Quality: 85/100
2. [Title] - Roofing/Pillar - Quality: 92/100
...

📈 STATS:
Total: X articles
Average Quality: XX/100
Words Generated: ~XX,XXX

🔨 BUILD: ✅ Success
🚀 DEPLOY: ✅ Live at myhomequoter.pages.dev

📋 NEXT PRIORITIES:
1. Create Roofing pillar content
2. Add 2 more Solar clusters
3. Create HVAC supporting content
═══════════════════════════════════════════════════
```

---

## Category-Specific Data

### Solar Articles
- **Federal Tax Credit**: 30% ITC through 2032
- **Average Cost**: $15,000-$35,000 (before incentives)
- **Cost per Watt**: $2.50-$3.50
- **Payback Period**: 6-10 years
- **System Size**: 6-12 kW typical
- **Links**: `/get-quotes/solar/`, `/solar/`

### Roofing Articles
- **Asphalt Shingles**: $5,000-$12,000 (20-30 year lifespan)
- **Metal Roofing**: $10,000-$25,000 (40-70 year lifespan)
- **Tile/Slate**: $15,000-$45,000 (50-100 year lifespan)
- **Cost per Sq Ft**: $4-$25 depending on material
- **Links**: `/get-quotes/roofing/`, `/roofing/`

### HVAC Articles
- **Central AC**: $3,500-$7,500
- **Furnace**: $2,500-$6,000
- **Heat Pump**: $4,000-$8,000
- **Full System**: $7,000-$15,000
- **SEER Ratings**: 14-25 (higher = more efficient)
- **Links**: `/get-quotes/hvac/`, `/hvac/`

---

## Troubleshooting

**If quality < 80:**
→ Regenerate with more specific instructions

**If build fails:**
→ Check frontmatter YAML syntax
→ Verify image URLs are valid

**If deploy fails:**
→ Run `npx wrangler login` first
→ Check Cloudflare project name
