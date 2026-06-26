import { Request, Response } from 'express';
import { validateFinnhubSecret, processFinnhubEvent } from '../service';

/**
 * POST /api/v1/webhooks/finnhub
 *
 * Finnhub webhook receiver. Per Finnhub's documentation:
 * - Must return 2xx IMMEDIATELY to acknowledge receipt.
 * - The X-Finnhub-Secret header is used for authentication.
 * - The endpoint is disabled if it fails to acknowledge events over consecutive days.
 */
export async function handleFinnhubWebhook(req: Request, res: Response) {
  // 1. Acknowledge receipt immediately with 200 to prevent Finnhub from disabling the endpoint.
  const secret = req.headers['x-finnhub-secret'] as string | undefined;

  if (!validateFinnhubSecret(secret)) {
    console.warn('[Webhook] Rejected: invalid X-Finnhub-Secret header');
    // Still return 200 to avoid leaking whether the secret is correct.
    // A 401/403 would tell an attacker the endpoint exists but auth failed.
    // However, Finnhub specifically requires 2xx for acknowledgement,
    // so returning 401 here is acceptable to reject unauthorized callers.
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Send 200 OK immediately before processing (Finnhub requirement).
  res.status(200).json({ received: true });

  // 3. Process the event asynchronously after the response is sent.
  try {
    await processFinnhubEvent(req.body || {});
  } catch (err) {
    console.error('[Webhook] Error processing Finnhub event:', err);
  }
}

/**
 * GET /api/v1/webhooks/finnhub
 *
 * Health check for the webhook endpoint. Useful for verifying the URL is reachable.
 */
export function webhookHealthCheck(_req: Request, res: Response) {
  res.status(200).json({
    status: 'active',
    endpoint: 'finnhub',
    message: 'Finnhub webhook endpoint is active and listening.',
  });
}
