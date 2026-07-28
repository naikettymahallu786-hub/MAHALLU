import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { Certificate } from '../models/Certificate';
import { CertificateRequest } from '../models/CertificateRequest';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { CertificateType } from '@mahallu/shared-types';

const r = Router();
r.use(authenticate);

// Admin fetches all issued certificates
r.get('/', authorize(PERMISSIONS.CERTIFICATE_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const certs = await Certificate.find({ tenantId: req.user!.tenantId })
      .populate('recipientId', 'name memberId phone email relationship')
      .populate('issuedBy', 'name role')
      .sort({ issuedAt: -1 })
      .lean();
    res.json({ success: true, data: certs });
  } catch (e) { next(e); }
});

// Admin fetches all certificate requests
r.get('/requests', authorize(PERMISSIONS.CERTIFICATE_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const status = req.query.status as string;
    const query: any = { tenantId: req.user!.tenantId };
    if (status) query.status = status;

    const requests = await CertificateRequest.find(query)
      .populate('requestedBy', 'name memberId phone email relationship familyId')
      .populate('certificateId')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: requests });
  } catch (e) { next(e); }
});

// Admin fetches a single certificate request
r.get('/requests/:id', authorize(PERMISSIONS.CERTIFICATE_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const request = await CertificateRequest.findOne({ _id: req.params.id, tenantId: req.user!.tenantId })
      .populate('requestedBy', 'name memberId phone email relationship familyId')
      .populate('certificateId')
      .lean();
    if (!request) throw new AppError('Request not found', 404);
    res.json({ success: true, data: request });
  } catch (e) { next(e); }
});

// Admin approves a certificate request with template selection, verified details, E-Sign & E-Stamp
r.post('/requests/:id/approve', authorize(PERMISSIONS.CERTIFICATE_CREATE), async (req: AuthRequest, res, next) => {
  try {
    const request = await CertificateRequest.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
    if (!request) throw new AppError('Request not found', 404);

    const { type, details, eSign, eStamp, customCertificateNo } = req.body;
    
    // Generate actual certificate
    const count = await Certificate.countDocuments({ tenantId: req.user!.tenantId });
    const certificateNo = customCertificateNo || `CERT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const certType = type || request.type || CertificateType.RESIDENCE;
    const certDetails = {
      ...(request.details || {}),
      ...(details || {}),
      purpose: request.purpose,
    };

    const cert = await Certificate.create({ 
      tenantId: req.user!.tenantId, 
      certificateNo, 
      type: certType, 
      recipientId: request.requestedBy, 
      issuedBy: req.user!.userId, 
      issuedAt: new Date(),
      data: certDetails,
      eSign: {
        isSigned: eSign?.isSigned ?? true,
        signedBy: eSign?.signedBy || 'Secretary, Mahallu Committee',
        designation: eSign?.designation || 'Authorized Signatory',
      },
      eStamp: {
        isStamped: eStamp?.isStamped ?? true,
        sealTitle: eStamp?.sealTitle || 'Official Seal of Mahallu Committee',
      },
    });
    
    request.status = 'APPROVED';
    request.certificateId = cert._id as any;
    if (type) request.type = type;
    await request.save();
    
    res.json({ success: true, data: cert });
  } catch (e) { next(e); }
});

// Admin rejects a certificate request
r.post('/requests/:id/reject', authorize(PERMISSIONS.CERTIFICATE_CREATE), async (req: AuthRequest, res, next) => {
  try {
    const request = await CertificateRequest.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
    if (!request) throw new AppError('Request not found', 404);
    
    request.status = 'REJECTED';
    if (req.body.notes) request.notes = req.body.notes;
    await request.save();
    
    res.json({ success: true, message: 'Request rejected' });
  } catch (e) { next(e); }
});

// Get single issued certificate details by ID
r.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const cert = await Certificate.findOne({ _id: req.params.id, tenantId: req.user!.tenantId })
      .populate('recipientId', 'name memberId phone email relationship familyId address')
      .populate('issuedBy', 'name role')
      .populate('tenantId', 'name code address logo')
      .lean();
    if (!cert) throw new AppError('Certificate not found', 404);
    res.json({ success: true, data: cert });
  } catch (e) { next(e); }
});

export default r;
