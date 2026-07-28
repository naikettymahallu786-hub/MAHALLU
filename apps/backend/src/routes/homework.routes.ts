import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { Homework } from '../models/Homework';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
const r = Router();
r.use(authenticate);
r.get('/', authorize(PERMISSIONS.HOMEWORK_VIEW), async (req: AuthRequest, res, next) => {
  try { const hw = await Homework.find({ tenantId: req.user!.tenantId, ...(req.query.classId ? { classId: req.query.classId } : {}) }).populate('teacherId', 'memberId').sort({ dueDate: 1 }).lean(); res.json({ success: true, data: hw }); } catch (e) { next(e); }
});
r.post('/', authorize(PERMISSIONS.HOMEWORK_CREATE), async (req: AuthRequest, res, next) => {
  try { const hw = await Homework.create({ ...req.body, tenantId: req.user!.tenantId }); res.status(201).json({ success: true, data: hw }); } catch (e) { next(e); }
});
r.post('/:id/submit', authorize(PERMISSIONS.HOMEWORK_SUBMIT), async (req: AuthRequest, res, next) => {
  try {
    const hw = await Homework.findOneAndUpdate({ _id: req.params.id, tenantId: req.user!.tenantId }, { $push: { submissions: { ...req.body, submittedAt: new Date() } } }, { new: true });
    if (!hw) throw new AppError('Homework not found', 404);
    res.json({ success: true, data: hw });
  } catch (e) { next(e); }
});
r.patch('/:id/grade', authorize(PERMISSIONS.HOMEWORK_GRADE), async (req: AuthRequest, res, next) => {
  try {
    const { studentId, grade, feedback } = req.body;
    await Homework.updateOne({ _id: req.params.id, tenantId: req.user!.tenantId, 'submissions.studentId': studentId }, { $set: { 'submissions.$.grade': grade, 'submissions.$.feedback': feedback, 'submissions.$.gradedAt': new Date() } });
    res.json({ success: true, message: 'Graded' });
  } catch (e) { next(e); }
});
export default r;
