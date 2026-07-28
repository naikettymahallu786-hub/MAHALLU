import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { Class } from '../models/Class';
import { Madrasa } from '../models/Madrasa';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.MADRASA_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const classes = await Class.find({ tenantId: req.user!.tenantId })
      .populate({
        path: 'teacherId',
        select: 'employeeId memberId',
        populate: {
          path: 'memberId',
          select: 'name'
        }
      })
      .sort({ level: 1 })
      .lean();
    res.json({ success: true, data: classes });
  } catch (e) { next(e); }
});

router.get('/:id', authorize(PERMISSIONS.MADRASA_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const classData = await Class.findOne({ _id: req.params.id, tenantId: req.user!.tenantId })
      .populate({
        path: 'teacherId',
        select: 'employeeId memberId subjects qualification',
        populate: {
          path: 'memberId',
          select: 'name photo phone email'
        }
      })
      .lean();
      
    if (!classData) {
      throw new AppError('Class not found', 404);
    }
    
    res.json({ success: true, data: classData });
  } catch (e) { next(e); }
});

router.post('/', authorize(PERMISSIONS.MADRASA_UPDATE), async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    // Get Madrasa
    const madrasa = await Madrasa.findOne({ tenantId });
    if (!madrasa) {
      throw new AppError('Madrasa not found for this tenant', 404);
    }

    const newClass = await Class.create({
      ...req.body,
      tenantId,
      madrasaId: madrasa._id,
    });

    // Add to madrasa classes
    madrasa.classes.push(newClass._id as any);
    await madrasa.save();

    res.status(201).json({ success: true, data: newClass });
  } catch (e) { next(e); }
});

router.put('/:id', authorize(PERMISSIONS.MADRASA_UPDATE), async (req: AuthRequest, res, next) => {
  try {
    const updated = await Class.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user!.tenantId },
      { $set: req.body },
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

export default router;
