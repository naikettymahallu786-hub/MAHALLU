import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { Student } from '../models/Student';
import { Member } from '../models/Member';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import QRCode from 'qrcode';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.STUDENT_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 20, classId, status, search } = req.query;
    const tenantId = req.user!.tenantId;
    const filter: Record<string, unknown> = { tenantId };
    if (classId) filter.classId = classId;
    if (status) filter.status = status;
    
    if (search) {
      const matchingMembers = await Member.find({ tenantId, name: { $regex: search as string, $options: 'i' } }, '_id').lean();
      const memberIds = matchingMembers.map(m => m._id);
      filter.$or = [
        { admissionNo: { $regex: search as string, $options: 'i' } },
        { memberId: { $in: memberIds } }
      ] as any;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const [students, total] = await Promise.all([
      Student.find(filter).populate('memberId', 'name photo dateOfBirth gender phone').populate('classId', 'name').populate('guardianId', 'name phone').sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Student.countDocuments(filter),
    ]);
    res.json({ success: true, data: students, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (e) { next(e); }
});

router.get('/:id', authorize(PERMISSIONS.STUDENT_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, tenantId: req.user!.tenantId }).populate('memberId classId guardianId').lean();
    if (!student) throw new AppError('Student not found', 404);
    res.json({ success: true, data: student });
  } catch (e) { next(e); }
});

router.post('/', authorize(PERMISSIONS.STUDENT_CREATE), async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const count = await Student.countDocuments({ tenantId });
    const admissionNo = `STD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const qrData = JSON.stringify({ admissionNo, tenantId, type: 'student' });
    const qrCode = await QRCode.toDataURL(qrData);
    const student = await Student.create({ ...req.body, tenantId, admissionNo, qrCode });
    res.status(201).json({ success: true, data: student });
  } catch (e) { next(e); }
});

router.put('/:id', authorize(PERMISSIONS.STUDENT_UPDATE), async (req: AuthRequest, res, next) => {
  try {
    const student = await Student.findOneAndUpdate({ _id: req.params.id, tenantId: req.user!.tenantId }, { $set: req.body }, { new: true });
    if (!student) throw new AppError('Student not found', 404);
    res.json({ success: true, data: student });
  } catch (e) { next(e); }
});

router.delete('/:id', authorize(PERMISSIONS.STUDENT_DELETE), async (req: AuthRequest, res, next) => {
  try {
    await Student.findOneAndUpdate({ _id: req.params.id, tenantId: req.user!.tenantId }, { isDeleted: true, deletedAt: new Date() });
    res.json({ success: true, message: 'Student removed' });
  } catch (e) { next(e); }
});

export default router;
