import { Router } from 'express';
import * as controller from '../controller';

const router = Router();

// No authentication middleware — webhooks are authenticated via X-Finnhub-Secret header
router.get('/finnhub', controller.webhookHealthCheck);
router.post('/finnhub', controller.handleFinnhubWebhook);

export default router;
