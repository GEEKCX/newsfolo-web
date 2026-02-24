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

// News queries for each category
const QUERIES: Record<string, string[]> = {
  all: ['breaking news', 'top stories'],
  tech: ['AI technology', 'artificial intelligence', 'tech news'],
  finance: ['stock market', 'finance economy', 'federal reserve'],
  stock: ['US stock market', 'NASDAQ', 'Wall Street'],
  vc: ['venture capital', 'startup funding', 'tech funding'],
  geo: ['geopolitics', 'world news', 'international'],
  commodity: ['oil gold', 'commodity markets', 'energy prices'],
};

// Fetch news from server-side API
export async function fetchNews(category: string = 'all'): Promise<NewsItem[]> {
  try {
    // Use our own API route to bypass CORS
    const response = await fetch(`/api/news?category=${category}`, {
      next: { revalidate: 60 } // Cache for 1 minute only
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }
    
    const data = await response.json();
    return data.news || [];
  } catch (error) {
    console.error('Error fetching news:', error);
    // Return fallback data
    return getSampleNews(category);
  }
}

// Sample news for fallback
function getSampleNews(category: string): NewsItem[] {
  const now = new Date().toISOString();
  
  const sampleNews: NewsItem[] = [
    {
      title: '加载实时新闻中...',
      url: '#',
      source: '正在获取最新新闻...',
      date: now,
      category: 'tech',
    },
  ];
  
  return sampleNews;
}

// Get market data (can be fetched from API in real implementation)
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
