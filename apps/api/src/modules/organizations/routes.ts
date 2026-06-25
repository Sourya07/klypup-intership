import { Router } from 'express';
import * as controller from './controller';
import { authenticate, requireRole, validate } from '../../middleware';
import { inviteSchema, joinByCodeSchema, joinByTokenSchema } from './schema';

const router = Router();

// All routes require authentication
router.use(authenticate());

router.get('/me', controller.getMyOrg);
router.get('/members', controller.getMembers);
router.post('/invite', requireRole('ADMIN'), validate(inviteSchema), controller.invite);
router.post('/join/code', validate(joinByCodeSchema), controller.joinByCode);
router.post('/join/token', validate(joinByTokenSchema), controller.joinByToken);

export default router;
