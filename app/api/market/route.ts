import { NextResponse } from 'next/server';

// Try multiple data sources for market data
const MARKET_SYMBOLS = [
  { label: 'S&P 500', symbol: '^GSPC' },
  { label: '纳斯达克', symbol: '^IXIC' },
  { label: '道琼斯', symbol: '^DJI' },
  { label: '黄金', symbol: 'GC=F' },
  { label: '原油', symbol: 'CL=F' },
  { label: '比特币', symbol: 'BTC-USD' },
];

// Method 1: Yahoo Finance v8 API
async function fetchFromYahoo(): Promise<any[]> {
  const results: any[] = [];
  
  // Fetch each symbol individually
  for (const item of MARKET_SYMBOLS) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${item.symbol}?interval=1d&range=1d`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 60 }
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const result = data.chart?.result?.[0];
      
      if (result) {
        const meta = result.meta;
        const quote = result.indicators?.quote?.[0];
        
        const price = meta.regularMarketPrice || 0;
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        const change = ((price - prevClose) / prevClose) * 100;
        
        let displayValue: string;
        if (item.symbol === '^GSPC' || item.symbol === '^IXIC' || item.symbol === '^DJI') {
          displayValue = price.toLocaleString('en-US', { maximumFractionDigits: 2 });
        } else if (item.symbol.includes('=X') || item.symbol === 'BTC-USD') {
          displayValue = '$' + price.toLocaleString('en-US', { maximumFractionDigits: 2 });
        } else {
          displayValue = '$' + price.toFixed(2);
        }
        
        results.push({
          label: item.label,
          value: displayValue,
          change: (change >= 0 ? '+' : '') + change.toFixed(2) + '%',
          up: change >= 0,
        });
      }
    } catch (error) {
      console.error(`Error fetching ${item.symbol}:`, error);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Method 2: Fallback - use Finnhub (free API)
async function fetchFromFinnhub(): Promise<any[]> {
  const results: any[] = [];
  const API_KEY = 'demo'; // Free demo key
  
  const symbolMap: Record<string, string> = {
    '^GSPC': 'SPY',  // S&P 500 ETF
    '^IXIC': 'QQQ',  // NASDAQ ETF
    '^DJI': 'DIA',   // Dow ETF
    'GC=F': 'XAUUSD', // Gold
    'CL=F': 'CLUSD',  // Oil
    'BTC-USD': 'BTCUSD', // Bitcoin
  };
  
  for (const item of MARKET_SYMBOLS) {
    try {
      const symbol = symbolMap[item.symbol] || item.symbol;
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
      
      const response = await fetch(url, { next: { revalidate: 60 } });
      if (!response.ok) continue;
      
      const data = await response.json();
      
      if (data.c) { // current price
        const change = ((data.c - data.pc) / data.pc) * 100;
        
        results.push({
          label: item.label,
          value: '$' + data.c.toFixed(2),
          change: (change >= 0 ? '+' : '') + change.toFixed(2) + '%',
          up: change >= 0,
        });
      }
    } catch (error) {
      console.error(`Error fetching ${item.symbol} from Finnhub:`, error);
    }
  }
  
  return results;
}

// Method 3: Fallback - use Twelve Data (free API)
async function fetchFromTwelveData(): Promise<any[]> {
  const results: any[] = [];
  const API_KEY = 'demo';
  
  const symbolMap: Record<string, string> = {
    '^GSPC': 'SPX',
    '^IXIC': 'IXIC',
    '^DJI': 'DJI',
    'GC=F': 'GC',
    'CL=F': 'CL',
    'BTC-USD': 'BTC/USD',
  };
  
  for (const item of MARKET_SYMBOLS) {
    try {
      const symbol = symbolMap[item.symbol] || item.symbol;
      const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${API_KEY}`;
      
      const response = await fetch(url, { next: { revalidate: 60 } });
      if (!response.ok) continue;
      
      const data = await response.json();
      
      if (data.close && data.percent_change) {
        results.push({
          label: item.label,
          value: '$' + parseFloat(data.close).toFixed(2),
          change: (parseFloat(data.percent_change) >= 0 ? '+' : '') + data.percent_change + '%',
          up: parseFloat(data.percent_change) >= 0,
        });
      }
    } catch (error) {
      console.error(`Error fetching ${item.symbol} from Twelve Data:`, error);
    }
  }
  
  return results;
}

function getFallbackData(): any[] {
  return [
    { label: 'S&P 500', value: '6,050.00', change: '+0.0%', up: true },
    { label: '纳斯达克', value: '19,500.00', change: '+0.0%', up: true },
    { label: '道琼斯', value: '39,000.00', change: '+0.0%', up: true },
    { label: '黄金', value: '$2,950', change: '+0.0%', up: true },
    { label: '原油', value: '$72.00', change: '+0.0%', up: false },
    { label: '比特币', value: '$95,000', change: '+0.0%', up: true },
  ];
}

export async function GET() {
  try {
    // Try Yahoo Finance first
    let data = await fetchFromYahoo();
    
    // If Yahoo fails, try Finnhub
    if (data.length === 0) {
      console.log('Trying Finnhub...');
      data = await fetchFromFinnhub();
    }
    
    // If Finnhub fails, try Twelve Data
    if (data.length === 0) {
      console.log('Trying Twelve Data...');
      data = await fetchFromTwelveData();
    }
    
    // If all fail, use fallback
    if (data.length === 0) {
      console.log('All APIs failed, using fallback data');
      data = getFallbackData();
    }
    
    return NextResponse.json({ market: data, source: 'Yahoo Finance' });
  } catch (error) {
    console.error('Market API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data', market: getFallbackData() },
      { status: 200 } // Return 200 with fallback data
    );
  }
}
