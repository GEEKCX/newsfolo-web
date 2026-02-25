// News data fetching utilities

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  date: string;
  category: string;
}

// 中文新闻分类
export const CATEGORIES = [
  { id: 'all', name: '全部', icon: '📰' },
  { id: 'tech', name: '科技/AI', icon: '🤖' },
  { id: 'finance', name: '金融/宏观', icon: '💹' },
  { id: 'stock', name: '美股/港股', icon: '📈' },
  { id: 'vc', name: '风投', icon: '🚀' },
  { id: 'geo', name: '国际政治', icon: '🌍' },
  { id: 'commodity', name: '大宗商品', icon: '🛢️' },
];

// 获取新闻的 API 端点
const API_URL = '/api/news';

export async function fetchNews(category: string = 'all'): Promise<NewsItem[]> {
  try {
    const response = await fetch(`${API_URL}?category=${category}`);
    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }
    const data = await response.json();
    return data.news || [];
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}
