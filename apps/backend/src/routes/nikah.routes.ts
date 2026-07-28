import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { Nikah } from '../models/Nikah';
import { AuthRequest } from '../middleware/auth';
const r = Router();
r.use(authenticate);
r.get('/', authorize(PERMISSIONS.NIKAH_VIEW), async (req: AuthRequest, res, next) => { try { const records = await Nikah.find({ tenantId: req.user!.tenantId }).sort({ date: -1 }).lean(); res.json({ success: true, data: records }); } catch (e) { next(e); } });
r.post('/', authorize(PERMISSIONS.NIKAH_REGISTER), async (req: AuthRequest, res, next) => {
  try {
    const count = await Nikah.countDocuments({ tenantId: req.user!.tenantId });
    const nikahNo = `NKH-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const n = await Nikah.create({ ...req.body, tenantId: req.user!.tenantId, nikahNo });
    res.status(201).json({ success: true, data: n });
  } catch (e) { next(e); }
});

r.get('/:id', authorize(PERMISSIONS.NIKAH_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const record = await Nikah.findOne({ _id: req.params.id, tenantId: req.user!.tenantId }).lean();
    if (!record) return res.status(404).json({ success: false, message: 'Nikah entry not found' });
    res.json({ success: true, data: record });
  } catch (e) { next(e); }
});

r.put('/:id', authorize(PERMISSIONS.NIKAH_REGISTER), async (req: AuthRequest, res, next) => {
  try {
    const n = await Nikah.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user!.tenantId },
      { ...req.body },
      { new: true }
    );
    res.json({ success: true, data: n });
  } catch (e) { next(e); }
});

r.delete('/:id', authorize(PERMISSIONS.NIKAH_REGISTER), async (req: AuthRequest, res, next) => {
  try {
    await Nikah.deleteOne({ _id: req.params.id, tenantId: req.user!.tenantId });
    res.json({ success: true });
  } catch (e) { next(e); }
});
export default r;
