import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { Property } from '../models/Property';
import { Lease } from '../models/Lease';
import { RentalRequest } from '../models/RentalRequest';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
const r = Router();
r.use(authenticate);
r.get('/', authorize(PERMISSIONS.PROPERTY_VIEW), async (req: AuthRequest, res, next) => { try { const props = await Property.find({ tenantId: req.user!.tenantId }).lean(); res.json({ success: true, data: props }); } catch (e) { next(e); } });


r.post('/', authorize(PERMISSIONS.PROPERTY_CREATE), async (req: AuthRequest, res, next) => {
  try {
    const count = await Property.countDocuments({ tenantId: req.user!.tenantId });
    const propertyCode = `PROP-${String(count + 1).padStart(4, '0')}`;
    
    // Default availableQuantity to total quantity if it's equipment
    const payload = { ...req.body };
    if (payload.type === 'equipment' && payload.quantity !== undefined) {
      payload.availableQuantity = payload.quantity;
    }
    
    const p = await Property.create({ ...payload, tenantId: req.user!.tenantId, propertyCode });
    res.status(201).json({ success: true, data: p });
  } catch (e) { next(e); }
});
r.get('/:id/leases', authorize(PERMISSIONS.PROPERTY_VIEW), async (req: AuthRequest, res, next) => { try { const leases = await Lease.find({ tenantId: req.user!.tenantId, propertyId: req.params.id }).populate('tenantMemberId', 'name phone').lean(); res.json({ success: true, data: leases }); } catch (e) { next(e); } });
r.post('/:id/leases', authorize(PERMISSIONS.PROPERTY_UPDATE), async (req: AuthRequest, res, next) => {
  try {
    const lease = await Lease.create({ ...req.body, tenantId: req.user!.tenantId, propertyId: req.params.id });
    await Property.findByIdAndUpdate(req.params.id, { currentLeaseId: lease._id, status: 'occupied' });
    res.status(201).json({ success: true, data: lease });
  } catch (e) { next(e); }
});

// Admin fetches all rental requests
r.get('/requests', authorize(PERMISSIONS.PROPERTY_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const requests = await RentalRequest.find({ tenantId: req.user!.tenantId })
      .populate('requestedBy', 'name phone')
      .populate('propertyId', 'name type')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: requests });
  } catch (e) { next(e); }
});

// Admin fetches a single rental request
r.get('/requests/:id', authorize(PERMISSIONS.PROPERTY_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const request = await RentalRequest.findOne({ _id: req.params.id, tenantId: req.user!.tenantId })
      .populate('requestedBy', 'name phone email')
      .populate('propertyId', 'name propertyCode type quantity availableQuantity')
      .lean();
    if (!request) throw new AppError('Request not found', 404);
    res.json({ success: true, data: request });
  } catch (e) { next(e); }
});

// Admin approves a rental request
r.post('/requests/:id/approve', authorize(PERMISSIONS.PROPERTY_UPDATE), async (req: AuthRequest, res, next) => {
  try {
    const request = await RentalRequest.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
    if (!request) throw new AppError('Request not found', 404);
    
    if (request.status !== 'PENDING') {
       throw new AppError('Request is already processed', 400);
    }
    
    const property = await Property.findOne({ _id: request.propertyId, tenantId: req.user!.tenantId });
    if (property && property.type === 'equipment') {
      if ((property.availableQuantity || 0) < request.quantityRequested) {
         throw new AppError('Not enough quantity available', 400);
      }
      property.availableQuantity = (property.availableQuantity || 0) - request.quantityRequested;
      await property.save();
    }
    
    request.status = 'APPROVED';
    await request.save();
    
    res.json({ success: true, data: request });
  } catch (e) { next(e); }
});

// Admin rejects a rental request
r.post('/requests/:id/reject', authorize(PERMISSIONS.PROPERTY_UPDATE), async (req: AuthRequest, res, next) => {
  try {
    const request = await RentalRequest.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
    if (!request) throw new AppError('Request not found', 404);
    
    request.status = 'REJECTED';
    await request.save();
    
    res.json({ success: true, message: 'Request rejected' });
  } catch (e) { next(e); }
});

r.get('/:id', authorize(PERMISSIONS.PROPERTY_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const prop = await Property.findOne({ _id: req.params.id, tenantId: req.user!.tenantId }).populate('currentLeaseId').lean();
    if (!prop) throw new AppError('Property not found', 404);
    res.json({ success: true, data: prop });
  } catch (e) { next(e); }
});

r.put('/:id', authorize(PERMISSIONS.PROPERTY_UPDATE), async (req: AuthRequest, res, next) => {
  try {
    const existing = await Property.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
    if (!existing) throw new AppError('Property not found', 404);
    
    const payload = { ...req.body };
    if (payload.type === 'equipment' && payload.quantity !== undefined) {
      const diff = payload.quantity - (existing.quantity || 0);
      payload.availableQuantity = (existing.availableQuantity || 0) + diff;
    }
    
    const prop = await Property.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user!.tenantId },
      payload,
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: prop });
  } catch (e) { next(e); }
});

export default r;
