import { NextResponse } from 'next/server';

// Finnhub API - Free tier: 60 calls/minute
const FINNHUB_API_KEY = 'd6f5vuhr01qvn4o1ujegd6f5vuhr01qvn4o1ujf0';

// Symbol mappings (Finnhub uses different symbols)
const MARKET_SYMBOLS = [
  { label: 'S&P 500', symbol: 'SPY', type: 'index' },
  { label: '纳斯达克', symbol: 'QQQ', type: 'index' },
  { label: '道琼斯', symbol: 'DIA', type: 'index' },
  { label: '黄金', symbol: 'GC=F', type: 'commodity' },
  { label: '原油', symbol: 'CL=F', type: 'commodity' },
  { label: '比特币', symbol: 'BTC-USD', type: 'crypto' },
  { label: '欧元/美元', symbol: 'EUR/USD', type: 'forex' },
];

// Fallback data (in case API fails)
function getFallbackData() {
  return [
    { label: 'S&P 500', value: '获取中...', change: '--%', up: true },
    { label: '纳斯达克', value: '获取中...', change: '--%', up: true },
    { label: '道琼斯', value: '获取中...', change: '--%', up: true },
    { label: '黄金', value: '获取中...', change: '--%', up: true },
    { label: '原油', value: '获取中...', change: '--%', up: false },
    { label: '比特币', value: '获取中...', change: '--%', up: true },
  ];
}

// Fetch quote from Finnhub
async function fetchFinnhubQuote(symbol: string) {
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 30 } });
    
    if (!response.ok) {
      console.error(`Finnhub error for ${symbol}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Finnhub fetch error for ${symbol}:`, error);
    return null;
  }
}

// Fetch crypto/forex from Yahoo Finance
async function fetchYahooFinance(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 30 }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) return null;
    
    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    return {
      c: meta.previousClose, // close price
      d: 0, // change
      dp: 0, // percent change
    };
  } catch (error) {
    console.error(`Yahoo fetch error for ${symbol}:`, error);
    return null;
  }
}

export async function GET() {
  const results: any[] = [];
  
  // Process each symbol
  for (const item of MARKET_SYMBOLS) {
    let quote = null;
    
    if (item.type === 'index' || item.type === 'commodity') {
      // Use Finnhub for indices and commodities
      quote = await fetchFinnhubQuote(item.symbol);
    } else {
      // Use Yahoo for crypto and forex
      quote = await fetchYahooFinance(item.symbol);
    }
    
    if (quote && quote.c) {
      const currentPrice = quote.c;
      const change = quote.dp || 0;
      const changeStr = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
      
      // Format value based on type
      let value = '';
      if (item.type === 'forex') {
        value = currentPrice.toFixed(4);
      } else if (item.type === 'crypto') {
        value = '$' + currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 });
      } else {
        value = currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 });
        if (item.type !== 'index') {
          value = '$' + value;
        }
      }
      
      results.push({
        label: item.label,
        value,
        change: changeStr,
        up: change >= 0,
      });
    } else {
      // If API fails, add with placeholder
      results.push({
        label: item.label,
        value: '--',
        change: '--%',
        up: true,
      });
    }
  }
  
  // If all failed, return fallback
  if (results.length === 0 || results.every(r => r.value === '--')) {
    return NextResponse.json({ 
      market: getFallbackData(),
      error: 'API unavailable, using fallback'
    });
  }
  
  return NextResponse.json({ market: results });
}
