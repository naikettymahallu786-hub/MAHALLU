import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Member } from '../models/Member';
import { Family } from '../models/Family';
import { AppError } from '../middleware/errorHandler';
import { DEFAULT_PAGINATION } from '@mahallu/shared-config';
import QRCode from 'qrcode';
import { nanoid } from 'nanoid';

export class MemberController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = DEFAULT_PAGINATION.page, limit = DEFAULT_PAGINATION.limit, search, status, familyId, gender } = req.query;
      const tenantId = req.user!.tenantId;

      const pageNum = Math.max(1, parseInt(page as string));
      const limitNum = Math.min(parseInt(limit as string), DEFAULT_PAGINATION.maxLimit);

      const filter: Record<string, unknown> = { tenantId };
      if (status) filter.status = status;
      if (familyId) filter.familyId = familyId;
      if (gender) filter.gender = gender;
      if (search) {
        filter.$text = { $search: search as string };
      }

      const [members, total] = await Promise.all([
        Member.find(filter)
          .populate('familyId', 'familyCode headMemberId address')
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean(),
        Member.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        message: 'Members retrieved',
        data: members,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await Member.findOne({ _id: req.params.id, tenantId: req.user!.tenantId })
        .populate('familyId userId')
        .lean();
      if (!member) throw new AppError('Member not found', 404);
      res.status(200).json({ success: true, message: 'Member found', data: member });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;

      // Generate member ID
      const count = await Member.countDocuments({ tenantId });
      const memberId = `MHL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      // Generate QR code
      const qrData = JSON.stringify({ memberId, tenantId, type: 'member' });
      const qrCode = await QRCode.toDataURL(qrData);

      const member = await Member.create({
        ...req.body,
        tenantId,
        memberId,
        qrCode,
      });

      // Sync with Family if familyId is provided
      if (req.body.familyId) {
        await Family.findOneAndUpdate(
          { _id: req.body.familyId, tenantId },
          { $push: { members: { memberId: member._id, relationship: req.body.relationship || 'Member', isHead: false } } }
        );
      }

      res.status(201).json({ success: true, message: 'Member created', data: member });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const oldMember = await Member.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
      if (!oldMember) throw new AppError('Member not found', 404);

      const oldFamilyId = oldMember.familyId?.toString();
      const newFamilyId = req.body.familyId?.toString();

      const member = await Member.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.user!.tenantId },
        { $set: req.body },
        { new: true, runValidators: true },
      );

      // Handle Family changes
      if (oldFamilyId !== newFamilyId) {
        if (oldFamilyId) {
          // Remove from old family
          await Family.findOneAndUpdate(
            { _id: oldFamilyId, tenantId: req.user!.tenantId },
            { $pull: { members: { memberId: member?._id } } }
          );
        }
        if (newFamilyId) {
          // Add to new family
          await Family.findOneAndUpdate(
            { _id: newFamilyId, tenantId: req.user!.tenantId },
            { $push: { members: { memberId: member?._id, relationship: req.body.relationship || 'Member', isHead: false } } }
          );
        }
      } else if (newFamilyId && req.body.relationship !== undefined) {
        // Just update relationship if family didn't change
        await Family.findOneAndUpdate(
          { _id: newFamilyId, tenantId: req.user!.tenantId, 'members.memberId': member?._id },
          { $set: { 'members.$.relationship': req.body.relationship } }
        );
      }

      res.status(200).json({ success: true, message: 'Member updated', data: member });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await Member.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.user!.tenantId },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      );
      if (!member) throw new AppError('Member not found', 404);
      res.status(200).json({ success: true, message: 'Member deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async getQRCard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await Member.findOne({ _id: req.params.id, tenantId: req.user!.tenantId })
        .populate('familyId', 'address wardNo')
        .lean();
      if (!member) throw new AppError('Member not found', 404);

      // Generate fresh QR if missing
      if (!member.qrCode) {
        const qrData = JSON.stringify({ memberId: member.memberId, tenantId: member.tenantId, type: 'member' });
        const qrCode = await QRCode.toDataURL(qrData);
        await Member.findByIdAndUpdate(member._id, { qrCode });
        member.qrCode = qrCode;
      }

      res.status(200).json({ success: true, message: 'QR card data', data: member });
    } catch (error) {
      next(error);
    }
  }

  static async search(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = req.query;
      if (!q) throw new AppError('Search query required', 400);

      const members = await Member.find({
        tenantId: req.user!.tenantId,
        $or: [
          { name: { $regex: q as string, $options: 'i' } },
          { phone: { $regex: q as string, $options: 'i' } },
          { memberId: { $regex: q as string, $options: 'i' } },
          { aadhaarNumber: { $regex: q as string, $options: 'i' } },
        ],
      }).limit(20).lean();

      res.status(200).json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const [total, active, inactive, deceased, male, female] = await Promise.all([
        Member.countDocuments({ tenantId }),
        Member.countDocuments({ tenantId, status: 'active' }),
        Member.countDocuments({ tenantId, status: 'inactive' }),
        Member.countDocuments({ tenantId, status: 'deceased' }),
        Member.countDocuments({ tenantId, gender: 'male' }),
        Member.countDocuments({ tenantId, gender: 'female' }),
      ]);

      res.status(200).json({
        success: true,
        data: { total, active, inactive, deceased, male, female },
      });
    } catch (error) {
      next(error);
    }
  }
}
