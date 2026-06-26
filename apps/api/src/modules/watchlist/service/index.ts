import { prisma, cache } from '../../../lib';
import { subscribeToFinnhub } from '../../../lib/finnhubWs';
import { ConflictError, NotFoundError } from '../../../utils/errors';

const COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  AMZN: 'Amazon.com, Inc.',
  GOOGL: 'Alphabet Inc.',
  META: 'Meta Platforms, Inc.',
  MSFT: 'Microsoft Corporation',
  NFLX: 'Netflix, Inc.',
  NVDA: 'NVIDIA Corporation',
  TSLA: 'Tesla, Inc.',
};

function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase();
}

function getCompanyName(symbol: string) {
  return COMPANY_NAMES[symbol] || `${symbol} Holdings`;
}

async function fetchYahooWatchlistData(symbol: string) {
  const ticker = symbol.trim().toUpperCase();
  const cacheKey = `watchlist:${ticker}`;

  // 1. Try to read from the MemoryCache first (takes <0.01ms)
  try {
    const cached = cache.get<any>(cacheKey);
    if (cached && typeof cached.price === 'number' && Array.isArray(cached.history)) {
      return {
        price: cached.price,
        change: cached.change ?? 0,
        sentiment: cached.sentiment ?? 'NEUTRAL',
        trendScore: cached.trendScore ?? 50,
        history: cached.history,
      };
    }
  } catch (err) {
    console.error(`Failed to read memory cache for ${ticker}:`, err);
  }

  // 2. Cache miss: fetch baseline data from Yahoo Finance
  const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1mo&interval=1d`;
  
  try {
    const response = await fetch(chartUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const json = await response.json() as any;
    const chart = json?.chart?.result?.[0];
    const meta = chart?.meta;
    
    const price = meta?.regularMarketPrice ?? meta?.chartPreviousClose ?? 0;
    const prevClose = meta?.chartPreviousClose ?? price;
    const change = prevClose !== 0 ? Number((((price - prevClose) / prevClose) * 100).toFixed(2)) : 0;
    const sentiment = change > 1.0 ? 'BULLISH' : change < -1.0 ? 'BEARISH' : 'NEUTRAL';
    
    const closes: Array<number | null> = chart?.indicators?.quote?.[0]?.close || [];
    const history = closes
      .filter((c): c is number => typeof c === 'number' && c !== null)
      .slice(-8); // Get last 8 close prices for sparkline
      
    const result = {
      price,
      change,
      sentiment,
      trendScore: Math.round(50 + change * 8),
      history: history.length > 0 ? history : [price, price, price, price, price, price, price, price],
      prevClose, // Store this so webhook updates can calculate percent changes accurately
    };

    // Store in MemoryCache for 15 minutes (900,000 ms)
    try {
      cache.set(cacheKey, result, 15 * 60 * 1000);
    } catch (cacheErr) {
      console.error(`Failed to write memory cache for ${ticker}:`, cacheErr);
    }

    return {
      price: result.price,
      change: result.change,
      sentiment: result.sentiment,
      trendScore: result.trendScore,
      history: result.history,
    };
  } catch (err) {
    console.error(`Failed to fetch Yahoo watchlist data for ${ticker}:`, (err as Error).message);
    
    // Fallback to Finnhub REST API if Yahoo fails (e.g. 429 Too Many Requests)
    const finnhubKey = process.env.FINNHUB_API_KEY;
    if (finnhubKey) {
      try {
        const fhRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${finnhubKey}`);
        if (fhRes.ok) {
          const fhData = await fhRes.json() as any;
          if (fhData && typeof fhData.c === 'number' && fhData.c !== 0) {
            const price = fhData.c;
            const prevClose = fhData.pc || price;
            const change = prevClose !== 0 ? Number((((price - prevClose) / prevClose) * 100).toFixed(2)) : 0;
            const result = {
              price,
              change,
              sentiment: change > 1.0 ? 'BULLISH' : change < -1.0 ? 'BEARISH' : 'NEUTRAL',
              trendScore: Math.round(50 + change * 8),
              history: [price, price, price, price, price, price, price, price],
              prevClose,
            };
            try { cache.set(cacheKey, result, 15 * 60 * 1000); } catch (e) {}
            console.log(`[Watchlist] Used Finnhub fallback for ${ticker}`);
            return {
              price: result.price,
              change: result.change,
              sentiment: result.sentiment,
              trendScore: result.trendScore,
              history: result.history,
            };
          }
        }
      } catch (fhErr) {
        console.error(`Failed to fetch Finnhub fallback data for ${ticker}:`, (fhErr as Error).message);
      }
    }

    return {
      price: 0,
      change: 0,
      sentiment: 'NEUTRAL',
      trendScore: 50,
      history: [0, 0, 0, 0, 0, 0, 0, 0],
    };
  }
}

export async function formatWatchlistItem(item: any) {
  const ticker = item.symbol;
  const marketData = await fetchYahooWatchlistData(ticker);

  return {
    id: item.id,
    watchlistId: item.organizationId,
    ticker,
    companyName: item.companyName,
    addedAt: item.createdAt.toISOString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    ...marketData,
  };
}

export async function getWatchlist(orgId: string) {
  return prisma.watchlistItem.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addToWatchlist(orgId: string, userId: string, ticker: string) {
  const symbol = normalizeTicker(ticker);
  const existing = await prisma.watchlistItem.findUnique({
    where: { organizationId_symbol: { organizationId: orgId, symbol } },
  });

  if (existing) {
    throw new ConflictError(`${symbol} is already in your watchlist`);
  }

  const newItem = await prisma.watchlistItem.create({
    data: {
      symbol,
      companyName: getCompanyName(symbol),
      organizationId: orgId,
      createdById: userId,
    },
  });

  subscribeToFinnhub(symbol);

  return newItem;
}

export async function removeFromWatchlist(orgId: string, itemId: string) {
  const item = await prisma.watchlistItem.findFirst({
    where: { id: itemId, organizationId: orgId },
  });

  if (!item) {
    throw new NotFoundError('Watchlist item');
  }

  await prisma.watchlistItem.delete({ where: { id: itemId } });
}
