import { Router } from 'express';
import { authenticate } from '../../../middleware';
import { searchEquities } from '../controller';

const router = Router();

router.use(authenticate());

router.get('/', searchEquities);

export default router;
