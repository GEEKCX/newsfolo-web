'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchNews, CATEGORIES, getMarketData, NewsItem } from '@/lib/news';

// 自动刷新间隔 (毫秒)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5分钟

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const marketData = getMarketData();

  const loadNews = useCallback(async () => {
    try {
      const data = await fetchNews(activeCategory);
      setNews(data);
      setLastUpdate(new Date().toLocaleString('zh-CN'));
    } catch (error) {
      console.error('Error loading news:', error);
    }
    setLoading(false);
  }, [activeCategory]);

  // 初始加载 + 分类切换
  useEffect(() => {
    setLoading(true);
    loadNews();
  }, [loadNews]);

  // 自动刷新
  useEffect(() => {
    if (!isAutoRefresh) return;
    
    const interval = setInterval(() => {
      console.log('🔄 自动刷新新闻...');
      loadNews();
    }, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [isAutoRefresh, loadNews]);

  return (
    <main>
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1>🌍 NewsFolo</h1>
          <p>全球每日新闻摘要 - 实时更新</p>
          <span className="badge">🕐 更新于 {lastUpdate || '加载中...'}</span>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav">
        <div className="container">
          <ul>
            {CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <a
                  href="#"
                  className={activeCategory === cat.id ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveCategory(cat.id);
                  }}
                >
                  {cat.icon} {cat.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container main">
        {/* Market Data */}
        <section className="section">
          <div className="section-header">
            <span className="icon">📊</span>
            <h2>市场数据</h2>
          </div>
          <div className="market-grid">
            {marketData.map((item, index) => (
              <div key={index} className="market-card">
                <div className="label">{item.label}</div>
                <div className="value">{item.value}</div>
                <div className={`change ${item.up ? 'up' : 'down'}`}>
                  {item.change}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* News Section */}
        <section className="section">
          <div className="section-header">
            <span className="icon">📰</span>
            <h2>
              {CATEGORIES.find((c) => c.id === activeCategory)?.name || '全部'} 新闻
            </h2>
            <button 
              className="refresh-btn" 
              onClick={loadNews}
              disabled={loading}
              style={{ marginLeft: 'auto' }}
            >
              {loading ? '🔄 加载中...' : '🔄 刷新'}
            </button>
            <button 
              className="refresh-btn" 
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              style={{ marginLeft: '10px', background: isAutoRefresh ? '#10b981' : '#64748b' }}
              title={isAutoRefresh ? '自动刷新已开启 (每5分钟)' : '自动刷新已关闭'}
            >
              {isAutoRefresh ? '⏱️ 自动' : '⏸️ 手动'}
            </button>
          </div>

          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>正在加载新闻...</p>
            </div>
          ) : (
            <div className="news-grid">
              {news.map((item, index) => (
                <article key={index} className="news-card">
                  <span className="category">{item.category || '新闻'}</span>
                  <h3>{item.title}</h3>
                  <div className="meta">
                    <span className="source">📰 {item.source}</span>
                  </div>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="link"
                  >
                    阅读原文 →
                  </a>
                </article>
              ))}
            </div>
          )}

          {!loading && news.length === 0 && (
            <div className="loading">
              <p>暂无新闻</p>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>📧 订阅每日邮件版 | 📱 Telegram 推送</p>
          <p>© 2026 NewsFolo - 全球新闻聚合平台</p>
        </div>
      </footer>
    </main>
  );
}
