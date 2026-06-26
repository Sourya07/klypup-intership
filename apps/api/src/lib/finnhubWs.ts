import WebSocket from 'ws';
import { prisma } from './prisma';
import { updateCacheAndBroadcast } from '../modules/webhooks/service';

let fhWs: WebSocket | null = null;
const subscribedSymbols = new Set<string>();

export async function initFinnhubWebSocket() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.warn('[FinnhubWS] FINNHUB_API_KEY not configured. Live trade sockets disabled.');
    return;
  }

  // Get initial symbols
  try {
    const items = await prisma.watchlistItem.findMany({
      select: { symbol: true },
      distinct: ['symbol']
    });
    items.forEach(i => subscribedSymbols.add(i.symbol.toUpperCase()));
  } catch (err) {
    console.error('[FinnhubWS] Failed to fetch initial watchlist items:', err);
  }

  connect(apiKey);
}

function connect(apiKey: string) {
  console.log('[FinnhubWS] Connecting to Finnhub WebSocket...');
  fhWs = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

  fhWs.on('open', () => {
    console.log('[FinnhubWS] Connected. Subscribing to symbols...');
    for (const sym of subscribedSymbols) {
      subscribeSymbol(sym);
    }
  });

  fhWs.on('message', async (data: WebSocket.RawData) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === 'trade' && Array.isArray(parsed.data)) {
        for (const trade of parsed.data) {
          if (trade.s && typeof trade.p === 'number') {
            await updateCacheAndBroadcast(trade.s, trade.p, trade.v || null, new Date());
          }
        }
      }
    } catch (err) {
      // Ignore parse errors
    }
  });

  fhWs.on('error', (err) => {
    console.error('[FinnhubWS] Error:', err);
  });

  fhWs.on('close', () => {
    console.log('[FinnhubWS] Connection closed. Reconnecting in 5s...');
    setTimeout(() => connect(apiKey), 5000);
  });
}

export function subscribeToFinnhub(symbol: string) {
  const sym = symbol.toUpperCase();
  if (!subscribedSymbols.has(sym)) {
    subscribedSymbols.add(sym);
    subscribeSymbol(sym);
  }
}

function subscribeSymbol(symbol: string) {
  if (fhWs && fhWs.readyState === WebSocket.OPEN) {
    fhWs.send(JSON.stringify({ type: 'subscribe', symbol }));
    console.log(`[FinnhubWS] Subscribed to ${symbol}`);
  }
}
