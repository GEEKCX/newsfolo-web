import { NextResponse } from 'next/server';

// Market data API - uses Yahoo Finance (via query1.finance.yahoo.com)
const MARKET_SYMBOLS = {
  'S&P 500': '^GSPC',
  '纳斯达克': '^IXIC',
  '道琼斯': '^DJI',
  '黄金': 'GC=F',
  '原油': 'CL=F',
  '比特币': 'BTC-USD',
  '欧元/美元': 'EURUSD=X',
  '英镑/美元': 'GBPUSD=X',
};

async function fetchMarketData() {
  const results: any[] = [];
  
  // Fetch multiple symbols at once
  const symbols = Object.values(MARKET_SYMBOLS).join(',');
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 60 } // Cache for 1 minute
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }
    
    const data = await response.json();
    const quotes = data.quoteResponse?.result || [];
    
    // Map back to labels
    const symbolToLabel: Record<string, string> = {};
    for (const [label, symbol] of Object.entries(MARKET_SYMBOLS)) {
      symbolToLabel[symbol] = label;
    }
    
    for (const quote of quotes) {
      const symbol = quote.symbol;
      const label = symbolToLabel[symbol] || symbol;
      
      let value = '';
      if (symbol.includes('=X')) {
        // Forex
        value = quote.regularMarketPrice?.toFixed(4) || '0';
      } else if (symbol === '^GSPC' || symbol === '^IXIC' || symbol === '^DJI') {
        // Indices
        value = quote.regularMarketPrice?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0';
      } else {
        // Commodities/Crypto
        value = '$' + (quote.regularMarketPrice?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0');
      }
      
      const change = quote.regularMarketChangePercent || 0;
      const changeStr = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
      
      results.push({
        label,
        value,
        change: changeStr,
        up: change >= 0,
      });
    }
    
  } catch (error) {
    console.error('Error fetching market data:', error);
    // Return fallback data on error
    return getFallbackData();
  }
  
  return results.length > 0 ? results : getFallbackData();
}

function getFallbackData() {
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
    const marketData = await fetchMarketData();
    return NextResponse.json({ market: marketData });
  } catch (error) {
    console.error('Market API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data', market: getFallbackData() },
      { status: 500 }
    );
  }
}
