import { Router } from 'express';
import { getLogs } from '../../controllers/activity-logs.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

// Protected routes
router.use(authenticate);

// Get activity logs with filters and pagination
router.get('/', getLogs);

export default router;
