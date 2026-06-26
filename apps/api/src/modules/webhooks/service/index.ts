import { prisma, broadcast } from '../../../lib';

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
export async function processFinnhubEvent(payload: Record<string, any>) {
  const eventType = payload.type || payload.event || 'unknown';
  const symbol = payload.symbol || payload.s || null;
  const timestamp = new Date();

  console.log(`[Webhook] Received Finnhub event: type=${eventType}, symbol=${symbol}, timestamp=${timestamp.toISOString()}`);

  // Store the event in the audit log for traceability
  try {
    await prisma.auditLog.create({
      data: {
        action: 'WEBHOOK_RECEIVED',
        resource: 'finnhub',
        resourceId: symbol,
        details: {
          eventType,
          payload,
          receivedAt: timestamp.toISOString(),
        },
        // Use a system-level placeholder since webhooks are not user-initiated
        userId: 'system',
        organizationId: 'system',
      },
    });
  } catch (err) {
    // Audit logging failure should not block webhook acknowledgement.
    // The audit log may fail if 'system' user/org don't exist with FK constraints.
    // In that case, just log to console.
    console.warn('[Webhook] Could not persist audit log (FK constraint likely):', (err as Error).message);
  }

  // If the event contains price data for a symbol on our watchlist,
  // update the CompanySnapshot cache so dashboards reflect fresh data.
  if (symbol && (eventType === 'trade' || eventType === 'price')) {
    try {
      const price = payload.p ?? payload.price ?? null;
      const volume = payload.v ?? payload.volume ?? null;

      if (price !== null) {
        const existing = await prisma.companySnapshot.findUnique({
          where: { symbol },
        });

        let mergedData: Record<string, any> = {
          price,
          lastPrice: price,
          lastVolume: volume,
          source: 'finnhub_webhook',
          updatedAt: timestamp.toISOString(),
        };

        if (existing && typeof existing.data === 'object' && existing.data !== null) {
          const currentData = existing.data as Record<string, any>;
          const prevClose = currentData.prevClose ?? currentData.previousClose ?? currentData.lastPrice ?? price;
          const change = prevClose !== 0 ? Number((((price - prevClose) / prevClose) * 100).toFixed(2)) : 0;
          const sentiment = change > 1.0 ? 'BULLISH' : change < -1.0 ? 'BEARISH' : 'NEUTRAL';
          
          let history = currentData.history || [];
          if (history.length > 0) {
            history = [...history];
            history[history.length - 1] = price;
          }

          mergedData = {
            ...currentData,
            price,
            lastPrice: price,
            lastVolume: volume ?? currentData.lastVolume,
            change,
            sentiment,
            trendScore: Math.round(50 + change * 8),
            history,
            source: 'finnhub_webhook',
            updatedAt: timestamp.toISOString(),
          };
        }

        await prisma.companySnapshot.upsert({
          where: { symbol },
          update: {
            data: mergedData,
            fetchedAt: timestamp,
            expiresAt: new Date(timestamp.getTime() + 15 * 60 * 1000), // Extend TTL
          },
          create: {
            symbol,
            data: mergedData,
            fetchedAt: timestamp,
            expiresAt: new Date(timestamp.getTime() + 15 * 60 * 1000),
          },
        });
        console.log(`[Webhook] Updated and merged CompanySnapshot for ${symbol}: price=${price}`);

        // Broadcast the update to all connected WebSocket clients
        broadcast('STOCK_UPDATE', {
          symbol,
          price,
          change: mergedData.change ?? 0,
          sentiment: mergedData.sentiment ?? 'NEUTRAL',
          trendScore: mergedData.trendScore ?? 50,
          history: mergedData.history ?? [],
        });
      }
    } catch (err) {
      console.warn(`[Webhook] Failed to update snapshot for ${symbol}:`, (err as Error).message);
    }
  }

  // Handle news events
  if (eventType === 'news' && symbol) {
    console.log(`[Webhook] News event for ${symbol}: ${payload.headline || payload.title || '(no headline)'}`);
  }

  return { processed: true, eventType, symbol };
}
