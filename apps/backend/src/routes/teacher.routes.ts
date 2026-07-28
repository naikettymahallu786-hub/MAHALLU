import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { Teacher } from '../models/Teacher';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
const r = Router();
r.use(authenticate);
r.get('/', authorize(PERMISSIONS.TEACHER_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string), limitNum = parseInt(limit as string);
    const [teachers, total] = await Promise.all([
      Teacher.find({ tenantId: req.user!.tenantId }).populate('memberId', 'name photo phone').sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Teacher.countDocuments({ tenantId: req.user!.tenantId }),
    ]);
    res.json({ success: true, data: teachers, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (e) { next(e); }
});
r.get('/:id', authorize(PERMISSIONS.TEACHER_VIEW), async (req: AuthRequest, res, next) => {
  try { const t = await Teacher.findOne({ _id: req.params.id, tenantId: req.user!.tenantId }).populate('memberId madrasaId').lean(); if (!t) throw new AppError('Teacher not found', 404); res.json({ success: true, data: t }); } catch (e) { next(e); }
});
r.post('/', authorize(PERMISSIONS.TEACHER_CREATE), async (req: AuthRequest, res, next) => {
  try {
    const count = await Teacher.countDocuments({ tenantId: req.user!.tenantId });
    const employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;
    const t = await Teacher.create({ ...req.body, tenantId: req.user!.tenantId, employeeId });
    res.status(201).json({ success: true, data: t });
  } catch (e) { next(e); }
});
r.put('/:id', authorize(PERMISSIONS.TEACHER_UPDATE), async (req: AuthRequest, res, next) => {
  try { const t = await Teacher.findOneAndUpdate({ _id: req.params.id, tenantId: req.user!.tenantId }, { $set: req.body }, { new: true }); if (!t) throw new AppError('Teacher not found', 404); res.json({ success: true, data: t }); } catch (e) { next(e); }
});
export default r;
