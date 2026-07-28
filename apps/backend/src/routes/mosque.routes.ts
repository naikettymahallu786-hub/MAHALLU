import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { Mosque } from '../models/Mosque';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.MEMBER_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const mosque = await Mosque.findOne({ tenantId: req.user!.tenantId })
      .populate('imamId muazzinId committee.memberId', 'name phone photo').lean();
    res.json({ success: true, data: mosque });
  } catch (e) { next(e); }
});

router.post('/', authorize(PERMISSIONS.SETTINGS_MANAGE), async (req: AuthRequest, res, next) => {
  try {
    const mosque = await Mosque.findOneAndUpdate(
      { tenantId: req.user!.tenantId },
      { ...req.body, tenantId: req.user!.tenantId },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: mosque });
  } catch (e) { next(e); }
});

router.get('/prayer-times', authorize(PERMISSIONS.MEMBER_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const { lat = '11.0168', lng = '76.9558', method = 1 } = req.query;
    const date = new Date();
    const response = await axios.get(
      `https://api.aladhan.com/v1/timings/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?latitude=${lat}&longitude=${lng}&method=${method}`
    );
    res.json({ success: true, data: response.data.data.timings });
  } catch (e) { next(e); }
});

export default router;
