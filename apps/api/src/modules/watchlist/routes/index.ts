import { Router } from 'express';
import * as controller from '../controller';
import { authenticate, validate } from '../../../middleware';
import { createWatchlistItemSchema } from '../schema';

const router = Router();

router.use(authenticate());

router.get('/', controller.listWatchlist);
router.post('/', validate(createWatchlistItemSchema), controller.addWatchlistItem);
router.delete('/:id', controller.removeWatchlistItem);

export default router;
