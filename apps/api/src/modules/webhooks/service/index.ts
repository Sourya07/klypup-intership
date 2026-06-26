import { prisma, broadcast, cache } from '../../../lib';

const FINNHUB_WEBHOOK_SECRET = process.env.FINNHUB_WEBHOOK_SECRET || '';

/**
 * Validate that the incoming request is genuinely from Finnhub
 * by comparing the X-Finnhub-Secret header against our stored secret.
 */
export function validateFinnhubSecret(headerSecret: string | undefined): boolean {
  if (!FINNHUB_WEBHOOK_SECRET) {
    console.warn('[Webhook] FINNHUB_WEBHOOK_SECRET is not configured. Rejecting all webhook requests.');
    return false;
  }
  return headerSecret === FINNHUB_WEBHOOK_SECRET;
}

/**
 * Process incoming Finnhub webhook events.
 * Finnhub can send various event types: trade updates, news, earnings, etc.
 * We log the event and update relevant watchlist/snapshot data.
 */
export async function updateCacheAndBroadcast(symbol: string, price: number, volume: number | null, timestamp: Date) {
  try {
    const cleanSymbol = symbol.trim().toUpperCase();
    const cacheKey = `watchlist:${cleanSymbol}`;
    const existing = cache.get<any>(cacheKey);

    let mergedData: Record<string, any> = {
      price,
      lastPrice: price,
      lastVolume: volume,
      source: 'finnhub_webhook',
      updatedAt: timestamp.toISOString(),
    };

    if (existing) {
      const prevClose = existing.prevClose ?? existing.lastPrice ?? price;
      const change = prevClose !== 0 ? Number((((price - prevClose) / prevClose) * 100).toFixed(2)) : 0;
      const sentiment = change > 1.0 ? 'BULLISH' : change < -1.0 ? 'BEARISH' : 'NEUTRAL';
      
      let history = existing.history || [];
      if (history.length > 0) {
        history = [...history];
        history[history.length - 1] = price;
      }

      mergedData = {
        ...existing,
        price,
        lastPrice: price,
        lastVolume: volume ?? existing.lastVolume,
        change,
        sentiment,
        trendScore: Math.round(50 + change * 8),
        history,
        source: 'finnhub_webhook',
        updatedAt: timestamp.toISOString(),
      };
    }

    // Write the merged data back to the MemoryCache with 15 minutes TTL
    cache.set(cacheKey, mergedData, 15 * 60 * 1000);
    console.log(`[Webhook] Updated and merged MemoryCache for ${cleanSymbol}: price=${price}`);

    // Broadcast the update to all connected WebSocket clients in real-time
    broadcast('STOCK_UPDATE', {
      symbol: cleanSymbol,
      price,
      change: mergedData.change ?? 0,
      sentiment: mergedData.sentiment ?? 'NEUTRAL',
      trendScore: mergedData.trendScore ?? 50,
      history: mergedData.history ?? [],
    });
  } catch (err) {
    console.warn(`[Webhook] Failed to update memory cache for ${symbol}:`, (err as Error).message);
  }
}

export async function processFinnhubEvent(payload: Record<string, any>) {
  const eventType = payload.type || payload.event || 'unknown';
  const timestamp = new Date();

  console.log(`[Webhook] Received Finnhub event: type=${eventType}, timestamp=${timestamp.toISOString()}`);

  // Note: We intentionally do not write to the AuditLog table for webhook receipts.
  // Doing so for high-frequency events causes foreign key constraint errors and rapid database bloat.

  // 1. Handle standard Finnhub real-time trade events (nested array)
  if (eventType === 'trade' && Array.isArray(payload.data)) {
    for (const trade of payload.data) {
      const symbol = trade.s || null;
      const price = trade.p ?? null;
      const volume = trade.v ?? null;

      if (symbol && price !== null) {
        await updateCacheAndBroadcast(symbol, price, volume, timestamp);
      }
    }
    return { processed: true, eventType, count: payload.data.length };
  }

  // 2. Handle flat payload fallback (e.g. mock test events, custom triggers)
  const symbol = payload.symbol || payload.s || null;
  if (symbol && (eventType === 'trade' || eventType === 'price')) {
    const price = payload.p ?? payload.price ?? null;
    const volume = payload.v ?? payload.volume ?? null;

    if (price !== null) {
      await updateCacheAndBroadcast(symbol, price, volume, timestamp);
      return { processed: true, eventType, symbol };
    }
  }

  // 3. Handle news events
  if (eventType === 'news' && symbol) {
    console.log(`[Webhook] News event for ${symbol}: ${payload.headline || payload.title || '(no headline)'}`);
  }

  return { processed: true, eventType, symbol };
}
