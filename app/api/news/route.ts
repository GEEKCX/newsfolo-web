import { NextResponse } from 'next/server';

// 中文新闻 RSS 源
const RSS_FEEDS = [
  // 主流中文媒体
  'https://www.chinanews.com.cn/rss/scroll-news.xml',  // 中国新闻网
  'https://www.sina.com.cn/rss/tech.xml',              // 新浪科技
  'https://finance.sina.com.cn/stock//',                // 新浪财经
  'https://news.baidu.com/n?cmd=1&class=cjinri',       // 百度财经
  'https://www.yicai.com/news/rss',                    // 第一财经
  'https://www.cls.cn/rss',                             // 财联社
  'https://www.thepaper.cn/rss_news.xml',               // 澎湃新闻
  'https://www.guancha.cn/news/',                       // 观察者网
];

// 备用：国际媒体中文版
const BACKUP_FEEDS = [
  'https://feeds.bbci.co.uk/zhongwen/simp/rss.xml',     // BBC 中文
  'https://www.dw.com/zhvector/zh-14982?m=1&rss',       // DW 中文
  'https://cn.reuters.com/rss-feed/CNTopStories/rss.xml', // 路透中文
];

// 中文关键词分类
const QUERIES: Record<string, string[]> = {
  all: ['要闻', '今日头条', '热点新闻'],
  tech: ['科技', '人工智能', 'AI', '互联网', '数码'],
  finance: ['财经', '股票', '金融', '经济', 'A股', '港股'],
  stock: ['股市', 'A股', '港股', '美股', '基金', '理财'],
  vc: ['融资', '投资', '创业', '风投', '独角兽'],
  geo: ['国际', '外交', '中美', '俄乌', '中东', '政治'],
  commodity: ['黄金', '原油', '大宗商品', '能源', '天然气'],
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
