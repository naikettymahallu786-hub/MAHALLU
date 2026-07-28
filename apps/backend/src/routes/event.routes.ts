import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { Event } from '../models/Event';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
const r = Router();
r.use(authenticate);
r.get('/', authorize(PERMISSIONS.EVENT_VIEW), async (req: AuthRequest, res, next) => { try { const events = await Event.find({ tenantId: req.user!.tenantId }).populate('committeeMembers.memberId', 'name photo phone').populate('registrations.memberId', 'name').sort({ date: -1 }).lean(); res.json({ success: true, data: events }); } catch (e) { next(e); } });
r.get('/:id', authorize(PERMISSIONS.EVENT_VIEW), async (req: AuthRequest, res, next) => { try { const event = await Event.findOne({ _id: req.params.id, tenantId: req.user!.tenantId }).populate('committeeMembers.memberId', 'name photo phone age gender occupation').populate('registrations.memberId', 'name photo phone').lean(); if(!event) throw new AppError('Event not found', 404); res.json({ success: true, data: event }); } catch (e) { next(e); } });
r.post('/', authorize(PERMISSIONS.EVENT_CREATE), async (req: AuthRequest, res, next) => {
  try {
    const e = await Event.create({ ...req.body, tenantId: req.user!.tenantId });
    const io = req.app.get('io');
    if (io) {
      io.to(`tenant-${req.user!.tenantId}`).emit('new-event', {
        title: `New Event: ${e.title}`,
        body: e.description || 'A new event has been scheduled.',
      });
    }
    res.status(201).json({ success: true, data: e });
  } catch (e) { next(e); }
});
r.put('/:id', authorize(PERMISSIONS.EVENT_UPDATE), async (req: AuthRequest, res, next) => { try { const e = await Event.findOneAndUpdate({ _id: req.params.id, tenantId: req.user!.tenantId }, { $set: req.body }, { new: true }); res.json({ success: true, data: e }); } catch (e) { next(e); } });
r.post('/:id/register', authorize(PERMISSIONS.EVENT_VIEW), async (req: AuthRequest, res, next) => { try { await Event.updateOne({ _id: req.params.id, tenantId: req.user!.tenantId }, { $push: { registrations: { memberId: req.body.memberId, registeredAt: new Date(), attended: false } } }); res.json({ success: true }); } catch (e) { next(e); } });
export default r;
