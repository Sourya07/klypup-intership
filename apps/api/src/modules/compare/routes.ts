import { Router } from 'express';
import * as controller from './controller';
import { authenticate } from '../../middleware';

const router = Router();

// Secure all comparison routes
router.use(authenticate());

// POST /api/v1/compare
router.post('/', controller.compare);

export default router;
