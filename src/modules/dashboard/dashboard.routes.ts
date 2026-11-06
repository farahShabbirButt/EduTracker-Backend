import { Router } from 'express';
import { DashboardController } from './index.js';

const router = Router();

router.get('/', DashboardController.get);

export default router;
