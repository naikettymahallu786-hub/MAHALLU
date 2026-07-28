import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { Transaction } from '../models/Transaction';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// GET /api/v1/finance/transactions
router.get('/transactions', authorize(PERMISSIONS.FINANCE_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const { year } = req.query;
    const query: any = { tenantId: req.user!.tenantId };
    
    if (year) {
      const startDate = new Date(`${year}-01-01T00:00:00Z`);
      const endDate = new Date(`${year}-12-31T23:59:59Z`);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate('recordedBy', 'name')
      .lean();

    res.json({ success: true, data: transactions });
  } catch (e) {
    next(e);
  }
});

// POST /api/v1/finance/transactions
router.post('/transactions', authorize(PERMISSIONS.FINANCE_CREATE), async (req: AuthRequest, res, next) => {
  try {
    const { type, amount, category, date, description, referenceNo } = req.body;
    
    if (!type || !amount || !category || !date || !description) {
      throw new AppError('Missing required fields', 400);
    }

    const transaction = await Transaction.create({
      tenantId: req.user!.tenantId,
      type,
      amount,
      category,
      date: new Date(date),
      description,
      referenceNo,
      recordedBy: req.user!.userId
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (e) {
    next(e);
  }
});

export default router;
