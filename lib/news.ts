// News data fetching utilities

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  date: string;
  category: string;
}

// News categories
export const CATEGORIES = [
  { id: 'all', name: '全部', icon: '📰' },
  { id: 'tech', name: '科技/AI', icon: '🤖' },
  { id: 'finance', name: '金融/宏观', icon: '💹' },
  { id: 'stock', name: '美股/港股', icon: '📈' },
  { id: 'vc', name: '风投', icon: '🚀' },
  { id: 'geo', name: '国际政治', icon: '🌍' },
  { id: 'commodity', name: '大宗商品', icon: '🛢️' },
];

// Fetch news from Google News RSS
export async function fetchNews(category: string = 'all'): Promise<NewsItem[]> {
  const queries: Record<string, string> = {
    all: 'breaking news today',
    tech: 'AI technology breaking news',
    finance: 'stock market financial news',
    stock: 'US stock market today',
    vc: 'venture capital funding news',
    geo: 'geopolitics world news',
    commodity: 'oil gold commodity price',
  };

  const query = queries[category] || queries.all;
  const encodedQuery = encodeURIComponent(query);
  
  // Try multiple news sources
  const sources = [
    `https://news.google.com/rss/search?q=${encodedQuery}&hl=zh-CN&gl=CN&ceid=CN:zh`,
    `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`,
  ];

  for (const url of sources) {
    try {
      const response = await fetch(url, { 
        next: { revalidate: 300 } // Cache for 5 minutes
      });
      
      if (!response.ok) continue;
      
      const xml = await response.text();
      const items = parseRSS(xml);
      
      if (items.length > 0) {
        return items.map(item => ({
          ...item,
          category,
        }));
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  }

  // Return sample data if all sources fail
  return getSampleNews(category);
}

// Parse RSS XML
function parseRSS(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  
  try {
    // Simple regex-based parsing (avoiding xml DOM issues)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
      const sourceMatch = itemXml.match(/<source>(.*?)<\/source>/);
      
      const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '') : '';
      const link = linkMatch ? linkMatch[1] : '';
      const source = sourceMatch ? sourceMatch[1] : 'Google News';
      
      if (title && link) {
        items.push({
          title: title.trim(),
          url: link.trim(),
          source: source.trim(),
          date: new Date().toISOString(),
          category: '',
        });
      }
    }
  } catch (error) {
    console.error('Error parsing RSS:', error);
  }
  
  return items;
}

// Sample news for fallback
function getSampleNews(category: string): NewsItem[] {
  const sampleNews: NewsItem[] = [
    {
      title: 'Anthropic 完成 300亿美元融资，估值达3800亿美元',
      url: 'https://www.cnbc.com',
      source: 'CNBC',
      date: new Date().toISOString(),
      category: 'tech',
    },
    {
      title: '美最高法院裁定取消大部分关税，市场反弹',
      url: 'https://www.investopedia.com',
      source: 'Investopedia',
      date: new Date().toISOString(),
      category: 'finance',
    },
    {
      title: '黄金突破 5080美元/盎司，创历史新高',
      url: 'https://www.tradingeconomics.com',
      source: 'Trading Economics',
      date: new Date().toISOString(),
      category: 'commodity',
    },
    {
      title: '美伊谈判僵局，中东局势紧张',
      url: 'https://www.cnn.com',
      source: 'CNN',
      date: new Date().toISOString(),
      category: 'geo',
    },
    {
      title: '微软宣布500亿美元AI投资计划',
      url: 'https://www.cnn.com',
      source: 'CNN Business',
      date: new Date().toISOString(),
      category: 'tech',
    },
    {
      title: 'OpenAI 推出新 Agent API',
      url: 'https://openai.com',
      source: 'OpenAI',
      date: new Date().toISOString(),
      category: 'tech',
    },
    {
      title: '俄乌战争进入第四年',
      url: 'https://www.foreignpolicy.com',
      source: 'Foreign Policy',
      date: new Date().toISOString(),
      category: 'geo',
    },
    {
      title: '聚变能源公司 Inertia 融资 4.5亿美元',
      url: 'https://siliconangle.com',
      source: 'SiliconANGLE',
      date: new Date().toISOString(),
      category: 'vc',
    },
  ];

  if (category === 'all') {
    return sampleNews;
  }
  
  return sampleNews.filter(item => item.category === category);
}

// Get market data (mock)
export function getMarketData() {
  return [
    { label: 'S&P 500', value: '6,909.51', change: '+0.7%', up: true },
    { label: '纳斯达克', value: '22,886.07', change: '+0.9%', up: true },
    { label: '道琼斯', value: '49,625.97', change: '+0.5%', up: true },
    { label: '黄金', value: '$5,080', change: '+2.1%', up: true },
    { label: '原油', value: '$78.50', change: '-0.8%', up: false },
    { label: '比特币', value: '$98,500', change: '+1.2%', up: true },
  ];
}
