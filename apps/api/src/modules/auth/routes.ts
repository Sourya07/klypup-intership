import { Router } from 'express';
import * as controller from './controller';
import { validate, authenticate } from '../../middleware';
import { signupSchema, loginSchema, refreshSchema, logoutSchema } from './schema';

const router = Router();

router.post('/signup', validate(signupSchema), controller.signup);
router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh', validate(refreshSchema), controller.refresh);
router.post('/logout', validate(logoutSchema), controller.logout);
router.get('/me', authenticate(), controller.me);
router.get('/check-invite', controller.checkInvite);

export default router;
