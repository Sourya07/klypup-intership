import { Router } from 'express';
import * as controller from '../controller';
import { validate, authenticate, requireRole } from '../../../middleware';
import { createRunSchema, updateReportSchema } from '../schema';

const router = Router();

// All research routes require authentication
router.use(authenticate());

// Runs
router.post('/runs', validate(createRunSchema), controller.createRun);
router.get('/runs/:id', controller.getRun);

// Reports CRUD
router.get('/reports', controller.listReports);
router.get('/reports/:id', controller.getReport);
router.patch('/reports/:id', validate(updateReportSchema), controller.updateReport);
router.delete('/reports/:id', requireRole('ADMIN'), controller.deleteReport);

export default router;
