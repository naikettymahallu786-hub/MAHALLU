import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/kpis', DashboardController.getKPIs);
router.get('/charts/income-expense', DashboardController.getIncomeExpenseChart);
router.get('/charts/attendance', DashboardController.getAttendanceChart);
router.get('/charts/member-growth', DashboardController.getMemberGrowthChart);
router.get('/recent-activity', DashboardController.getRecentActivity);

export default router;
