// Remaining route stubs — fully functional scaffolds with auth + RBAC

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { Madrasa } from '../models/Madrasa';
import { AuthRequest } from '../middleware/auth';
const r = Router();
r.use(authenticate);
r.get('/', authorize(PERMISSIONS.MADRASA_VIEW), async (req: AuthRequest, res, next) => {
  try { const m = await Madrasa.findOne({ tenantId: req.user!.tenantId }).populate('principalId', 'name').lean(); res.json({ success: true, data: m }); } catch (e) { next(e); }
});
r.post('/', authorize(PERMISSIONS.MADRASA_CREATE), async (req: AuthRequest, res, next) => {
  try { const m = await Madrasa.findOneAndUpdate({ tenantId: req.user!.tenantId }, { ...req.body, tenantId: req.user!.tenantId }, { upsert: true, new: true }); res.json({ success: true, data: m }); } catch (e) { next(e); }
});
export default r;
