import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { Cemetery } from '../models/Cemetery';
import { PlotRequest } from '../models/PlotRequest';
import { AuthRequest } from '../middleware/auth';
const r = Router();
r.use(authenticate);

r.get('/', authorize(PERMISSIONS.CEMETERY_VIEW), async (req: AuthRequest, res, next) => { 
  try { 
    let c = await Cemetery.findOne({ tenantId: req.user!.tenantId }).lean(); 
    if (!c) {
      const newC = await Cemetery.create({
        tenantId: req.user!.tenantId,
        name: 'Main Cemetery',
        capacity: 60,
        plots: Array.from({ length: 60 }, (_, i) => ({
          plotNo: `P-${i + 1}`,
          section: 'A',
          status: 'available',
          isOccupied: false
        }))
      });
      c = newC.toObject() as any;
    }
    res.json({ success: true, data: c }); 
  } catch (e) { next(e); } 
});

r.post('/', authorize(PERMISSIONS.CEMETERY_MANAGE), async (req: AuthRequest, res, next) => { 
  try { 
    const c = await Cemetery.findOneAndUpdate({ tenantId: req.user!.tenantId }, { ...req.body, tenantId: req.user!.tenantId }, { upsert: true, new: true }); 
    res.json({ success: true, data: c }); 
  } catch (e) { next(e); } 
});

r.put('/plots', authorize(PERMISSIONS.CEMETERY_MANAGE), async (req: AuthRequest, res, next) => {
  try {
    const { plotNo, status, isOccupied, section, row, bookedById } = req.body;
    await Cemetery.updateOne(
      { tenantId: req.user!.tenantId, 'plots.plotNo': plotNo },
      { $set: { 
          'plots.$.status': status, 
          'plots.$.isOccupied': isOccupied,
          'plots.$.section': section,
          'plots.$.row': row,
          'plots.$.bookedById': bookedById || null
        } 
      }
    );
    res.json({ success: true });
  } catch (e) { next(e); }
});

r.post('/plots/occupy', authorize(PERMISSIONS.CEMETERY_MANAGE), async (req: AuthRequest, res, next) => {
  try {
    const { plotNo, deceasedId } = req.body;
    await Cemetery.updateOne({ tenantId: req.user!.tenantId, 'plots.plotNo': plotNo }, { $set: { 'plots.$.status': 'occupied', 'plots.$.isOccupied': true, 'plots.$.deceasedId': deceasedId, 'plots.$.occupiedAt': new Date() } });
    res.json({ success: true });
  } catch (e) { next(e); }
});

r.post('/plots', authorize(PERMISSIONS.CEMETERY_MANAGE), async (req: AuthRequest, res, next) => {
  try {
    const { plotNo, section, row, status } = req.body;
    if (!plotNo) {
      return res.status(400).json({ success: false, message: 'Plot number is required' });
    }
    
    const cemetery = await Cemetery.findOne({ tenantId: req.user!.tenantId });
    if (!cemetery) {
      return res.status(404).json({ success: false, message: 'Cemetery not found' });
    }
    
    const exists = cemetery.plots.some(p => p.plotNo === plotNo);
    if (exists) {
      return res.status(400).json({ success: false, message: `Plot ${plotNo} already exists` });
    }
    
    cemetery.plots.push({
      plotNo,
      section: section || 'A',
      row: row || '',
      status: status || 'available',
      isOccupied: status === 'occupied',
      photos: []
    });
    
    cemetery.capacity = cemetery.plots.length;
    await cemetery.save();
    
    res.json({ success: true, data: cemetery });
  } catch (e) { next(e); }
});

r.delete('/plots/:plotNo', authorize(PERMISSIONS.CEMETERY_MANAGE), async (req: AuthRequest, res, next) => {
  try {
    const { plotNo } = req.params;
    
    const cemetery = await Cemetery.findOne({ tenantId: req.user!.tenantId });
    if (!cemetery) {
      return res.status(404).json({ success: false, message: 'Cemetery not found' });
    }
    
    const index = cemetery.plots.findIndex(p => p.plotNo === plotNo);
    if (index === -1) {
      return res.status(404).json({ success: false, message: `Plot ${plotNo} not found` });
    }
    
    cemetery.plots.splice(index, 1);
    cemetery.capacity = cemetery.plots.length;
    await cemetery.save();
    
    res.json({ success: true, data: cemetery });
  } catch (e) { next(e); }
});

r.get('/requests', authorize(PERMISSIONS.CEMETERY_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const requests = await PlotRequest.find({ tenantId: req.user!.tenantId })
      .populate('requestedBy', 'name memberId phone photo')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: requests });
  } catch (e) { next(e); }
});

r.put('/requests/:id', authorize(PERMISSIONS.CEMETERY_MANAGE), async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.body; // 'approved' | 'rejected'
    const request = await PlotRequest.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user!.tenantId },
      { status },
      { new: true }
    );
    
    if (request && status === 'approved') {
      await Cemetery.updateOne(
        { tenantId: req.user!.tenantId, 'plots.plotNo': request.plotNo },
        { $set: { 'plots.$.status': 'booked', 'plots.$.bookedById': request.requestedBy } }
      );
    }
    
    res.json({ success: true, data: request });
  } catch (e) { next(e); }
});

export default r;
