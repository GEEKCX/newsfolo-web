import { NextResponse } from 'next/server';

// News queries for each category
const QUERIES: Record<string, string[]> = {
  all: ['breaking news', 'top stories today'],
  tech: ['AI technology', 'artificial intelligence news', 'tech breaking'],
  finance: ['stock market', 'finance economy', 'federal reserve'],
  stock: ['US stock market', 'NASDAQ', 'Wall Street today'],
  vc: ['venture capital', 'startup funding', 'tech funding'],
  geo: ['geopolitics', 'world news', 'international'],
  commodity: ['oil gold commodity', 'energy prices', 'markets'],
};

// RSS feed URLs that work without CORS
const RSS_FEEDS = [
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://feeds.reuters.com/reuters/topNews',
  'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
];

async function fetchFromRSS(): Promise<any[]> {
  const allNews: any[] = [];
  
  for (const feed of RSS_FEEDS) {
    try {
      const response = await fetch(feed, {
        next: { revalidate: 60 } // Cache for 1 minute
      });
      
      if (!response.ok) continue;
      
      const xml = await response.text();
      const items = parseRSS(xml);
      allNews.push(...items);
      
      // Add small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error fetching ${feed}:`, error);
    }
  }
  
  return allNews;
}

function parseRSS(xml: string): any[] {
  const items: any[] = [];
  
  try {
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null && items.length < 15) {
      const itemXml = match[1];
      
      // Extract title
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
      const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
      
      // Extract link
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
      const link = linkMatch ? linkMatch[1].trim() : '';
      
      // Extract source
      const sourceMatch = itemXml.match(/<source>(.*?)<\/source>/);
      const source = sourceMatch ? sourceMatch[1].trim() : 'Reuters/BBC/NYT';
      
      // Extract date
      const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>|<dc:date>(.*?)<\/dc:date>/);
      const dateStr = dateMatch ? (dateMatch[1] || dateMatch[2] || '') : '';
      const date = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
      
      if (title && link) {
        items.push({
          title: title.substring(0, 200),
          url: link,
          source: source.substring(0, 50),
          date,
        });
      }
    }
  } catch (error) {
    console.error('Error parsing RSS:', error);
  }
  
  return items;
}

// Categorize news based on title
function categorizeNews(news: any[]): any[] {
  const techKeywords = ['AI', 'artificial intelligence', 'tech', 'technology', 'google', 'microsoft', 'openai', 'apple', 'amazon', 'meta', 'nvidia'];
  const financeKeywords = ['stock', 'market', 'finance', 'economy', 'federal', 'reserve', 'inflation', 'interest', 'bank', 'wall street'];
  const geoKeywords = ['russia', 'ukraine', 'china', 'trump', 'biden', 'iran', 'israel', 'war', 'military', 'nato', 'europe'];
  const commodityKeywords = ['oil', 'gold', 'commodity', 'energy', 'price', '天然气', '石油', '黄金'];
  const vcKeywords = ['funding', 'venture', 'startup', 'investment', 'billion', 'valuation', 'series'];
  
  return news.map(item => {
    const titleLower = item.title.toLowerCase();
    
    let category = 'all';
    if (techKeywords.some(k => titleLower.includes(k))) category = 'tech';
    else if (financeKeywords.some(k => titleLower.includes(k))) category = 'finance';
    else if (geoKeywords.some(k => titleLower.includes(k))) category = 'geo';
    else if (vcKeywords.some(k => titleLower.includes(k))) category = 'vc';
    else if (commodityKeywords.some(k => titleLower.includes(k))) category = 'commodity';
    else if (titleLower.includes('stock') || titleLower.includes('nasdaq') || titleLower.includes('dow')) category = 'stock';
    
    return { ...item, category };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';
  
  try {
    // Fetch from multiple RSS feeds
    let news = await fetchFromRSS();
    
    // Categorize news
    news = categorizeNews(news);
    
    // Filter by category
    if (category !== 'all') {
      news = news.filter(item => item.category === category || item.category === 'all');
    }
    
    // Sort by date (newest first)
    news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Limit results
    news = news.slice(0, 20);
    
    return NextResponse.json({ news });
  } catch (error) {
    console.error('Error in news API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', news: [] },
      { status: 500 }
    );
  }
}
