/**
 * Google Indexing API - Auto-submit new URLs for indexing
 *
 * This script pings Google to request indexing of new blog posts
 * Uses the standard sitemap ping method (free, no API key required)
 */

const SITE_URL = 'https://myhomequoter.com';
const SITEMAP_URL = `${SITE_URL}/sitemap-index.xml`;

/**
 * Ping Google to re-crawl sitemap (free method)
 */
export async function pingSitemapToGoogle(): Promise<boolean> {
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;

  try {
    const response = await fetch(pingUrl);
    if (response.ok) {
      console.log('✅ Google sitemap ping successful');
      return true;
    }
    console.warn('⚠️ Google sitemap ping returned:', response.status);
    return false;
  } catch (error) {
    console.error('❌ Failed to ping Google:', error);
    return false;
  }
}

/**
 * Ping Bing to re-crawl sitemap (free method)
 */
export async function pingSitemapToBing(): Promise<boolean> {
  const pingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;

  try {
    const response = await fetch(pingUrl);
    if (response.ok) {
      console.log('✅ Bing sitemap ping successful');
      return true;
    }
    console.warn('⚠️ Bing sitemap ping returned:', response.status);
    return false;
  } catch (error) {
    console.error('❌ Failed to ping Bing:', error);
    return false;
  }
}

/**
 * Submit specific URLs to IndexNow (Bing, Yandex, etc.)
 * Free and instant indexing
 */
export async function submitToIndexNow(urls: string[]): Promise<boolean> {
  // IndexNow requires an API key file at your domain
  // You need to create a file at: https://myhomequoter.com/{key}.txt
  const indexNowKey = process.env.INDEXNOW_KEY;

  if (!indexNowKey) {
    console.log('ℹ️ IndexNow key not configured, skipping');
    return false;
  }

  const payload = {
    host: 'myhomequoter.com',
    key: indexNowKey,
    keyLocation: `https://myhomequoter.com/${indexNowKey}.txt`,
    urlList: urls
  };

  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok || response.status === 202) {
      console.log(`✅ IndexNow: Submitted ${urls.length} URLs`);
      return true;
    }
    console.warn('⚠️ IndexNow returned:', response.status);
    return false;
  } catch (error) {
    console.error('❌ IndexNow submission failed:', error);
    return false;
  }
}

/**
 * Notify all search engines about new content
 */
export async function notifySearchEngines(newUrls: string[] = []): Promise<void> {
  console.log('\n🔔 Notifying search engines...\n');

  // Always ping sitemaps
  await Promise.all([
    pingSitemapToGoogle(),
    pingSitemapToBing()
  ]);

  // If we have specific new URLs, submit to IndexNow
  if (newUrls.length > 0) {
    await submitToIndexNow(newUrls);
  }

  console.log('\n✅ Search engine notifications complete\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  notifySearchEngines();
}
