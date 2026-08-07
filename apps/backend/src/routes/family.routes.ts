import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { Family } from '../models/Family';
import { Member } from '../models/Member';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import QRCode from 'qrcode';

export function calculateNextDueDate(
  type?: 'monthly' | 'yearly' | 'none',
  day: number = 1,
  month: number = 1,
  lastPaymentDate?: Date
): Date | undefined {
  if (!type || type === 'none') return undefined;

  const now = lastPaymentDate ? new Date(lastPaymentDate) : new Date();
  const safeDay = Math.min(Math.max(1, day || 1), 28);
  const safeMonth = Math.min(Math.max(1, month || 1), 12);

  if (type === 'monthly') {
    const candidate = new Date(now.getFullYear(), now.getMonth(), safeDay);
    if (candidate <= now) {
      candidate.setMonth(candidate.getMonth() + 1);
    }
    return candidate;
  }

  if (type === 'yearly') {
    const candidate = new Date(now.getFullYear(), safeMonth - 1, safeDay);
    if (candidate <= now) {
      candidate.setFullYear(candidate.getFullYear() + 1);
    }
    return candidate;
  }

  return undefined;
}

const router = Router();
router.use(authenticate);

// ──────────────────────────────────────────────────
// GET /families/reports/recurring
// Detailed recurring donation report with filters & CSV export
// ──────────────────────────────────────────────────
router.get('/reports/recurring', authorize(PERMISSIONS.FAMILY_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const {
      search,
      paymentStatus = 'all',
      recurringType = 'all',
      startDate,
      endDate,
      month,
      year,
      format = 'json',
    } = req.query;

    const filter: Record<string, any> = {
      tenantId,
      isDeleted: { $ne: true },
      recurringDonationType: { $in: ['monthly', 'yearly'] },
    };

    if (recurringType && recurringType !== 'all') {
      filter.recurringDonationType = recurringType;
    }

    if (search) {
      const cleanSearch = String(search).trim();
      const searchRegex = new RegExp(cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

      const matchingMembers = await Member.find({
        tenantId,
        $or: [{ name: searchRegex }, { phone: searchRegex }],
      }).select('_id').lean();

      const memberIds = matchingMembers.map(m => m._id);

      filter.$or = [
        { familyCode: searchRegex },
        { 'address.line1': searchRegex },
        { wardNo: searchRegex },
        { headMemberId: { $in: memberIds } },
        { 'members.memberId': { $in: memberIds } },
      ];
    }

    // Handle Date Filtering (month, year, date ranges)
    let dateRangeFilter: any = null;
    if (startDate || endDate) {
      dateRangeFilter = {};
      if (startDate) dateRangeFilter.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        dateRangeFilter.$lte = end;
      }
    } else if (year) {
      const yr = parseInt(year as string);
      if (month && month !== 'all') {
        const m = parseInt(month as string) - 1;
        const start = new Date(yr, m, 1);
        const end = new Date(yr, m + 1, 0, 23, 59, 59, 999);
        dateRangeFilter = { $gte: start, $lte: end };
      } else {
        const start = new Date(yr, 0, 1);
        const end = new Date(yr, 11, 31, 23, 59, 59, 999);
        dateRangeFilter = { $gte: start, $lte: end };
      }
    }

    if (dateRangeFilter) {
      filter.$or = [
        { nextPaymentDueDate: dateRangeFilter },
        { lastPaymentDate: dateRangeFilter },
        { updatedAt: dateRangeFilter },
      ];
    }

    const families = await Family.find(filter)
      .populate('headMemberId', 'name phone email photo gender memberId')
      .populate('members.memberId', 'name phone')
      .sort({ familyCode: 1 })
      .collation({ locale: 'en', numericOrdering: true })
      .lean();

    const today = new Date();

    const items = families.map((f: any) => {
      const head = f.headMemberId;
      const outstanding = f.outstandingBalance || 0;
      const amount = f.recurringDonationAmount || 0;
      const nextDue = f.nextPaymentDueDate ? new Date(f.nextPaymentDueDate) : null;

      let status = 'PAID';
      if (outstanding > 0) {
        if (nextDue && nextDue < today) {
          status = 'OVERDUE';
        } else {
          status = 'UNPAID';
        }
      }

      return {
        _id: f._id,
        familyCode: f.familyCode,
        headName: head?.name || 'N/A',
        headPhone: head?.phone || 'N/A',
        wardNo: f.wardNo || 'N/A',
        address: f.address?.line1 || 'N/A',
        recurringType: f.recurringDonationType || 'none',
        recurringAmount: amount,
        outstandingBalance: outstanding,
        lastPaymentDate: f.lastPaymentDate || null,
        nextPaymentDueDate: f.nextPaymentDueDate || null,
        status,
      };
    });

    // Apply paymentStatus filtering
    const filteredItems = items.filter((item) => {
      if (paymentStatus === 'paid') return item.status === 'PAID';
      if (paymentStatus === 'unpaid') return item.status === 'UNPAID' || item.status === 'OVERDUE';
      if (paymentStatus === 'overdue') return item.status === 'OVERDUE';
      if (paymentStatus === 'pending') return item.status === 'UNPAID' || item.status === 'OVERDUE';
      return true;
    });

    // Summary Analytics
    const summary = {
      totalCount: filteredItems.length,
      totalExpected: filteredItems.reduce((acc, i) => acc + i.recurringAmount, 0),
      totalOutstanding: filteredItems.reduce((acc, i) => acc + i.outstandingBalance, 0),
      paidCount: filteredItems.filter(i => i.status === 'PAID').length,
      unpaidCount: filteredItems.filter(i => i.status === 'UNPAID').length,
      overdueCount: filteredItems.filter(i => i.status === 'OVERDUE').length,
    };

    if (format === 'csv') {
      const headers = ['Family Code', 'Head Name', 'Phone', 'Ward', 'Address', 'Recurring Frequency', 'Recurring Amount (INR)', 'Outstanding Dues (INR)', 'Next Due Date', 'Status'];
      const csvRows = [headers.join(',')];

      filteredItems.forEach(item => {
        const row = [
          `"${item.familyCode}"`,
          `"${item.headName.replace(/"/g, '""')}"`,
          `"${item.headPhone}"`,
          `"${item.wardNo}"`,
          `"${item.address.replace(/"/g, '""')}"`,
          `"${item.recurringType}"`,
          item.recurringAmount,
          item.outstandingBalance,
          item.nextPaymentDueDate ? `"${new Date(item.nextPaymentDueDate).toISOString().split('T')[0]}"` : '""',
          `"${item.status}"`,
        ];
        csvRows.push(row.join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="recurring_donations_report_${Date.now()}.csv"`);
      return res.send(csvRows.join('\n'));
    }

    res.json({
      success: true,
      data: {
        summary,
        items: filteredItems,
      },
    });
  } catch (e) { next(e); }
});

router.get('/', authorize(PERMISSIONS.FAMILY_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'familyCode', sortOrder = 'asc' } = req.query;
    const tenantId = req.user!.tenantId;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(parseInt(limit as string), 500);
    const filter: Record<string, unknown> = { tenantId, isDeleted: { $ne: true } };

    if (search) {
      const cleanSearch = String(search).trim();
      const searchRegex = new RegExp(cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

      const matchingMembers = await Member.find({
        tenantId,
        $or: [
          { name: searchRegex },
          { phone: searchRegex },
        ],
      }).select('_id').lean();

      const memberIds = matchingMembers.map(m => m._id);

      filter.$or = [
        { familyCode: searchRegex },
        { 'address.line1': searchRegex },
        { headMemberId: { $in: memberIds } },
        { 'members.memberId': { $in: memberIds } },
      ];
    }

    const sortDir = sortOrder === 'desc' ? -1 : 1;
    const sortObj: Record<string, 1 | -1> = { [sortBy as string]: sortDir };

    const [families, total] = await Promise.all([
      Family.find(filter)
        .collation({ locale: 'en', numericOrdering: true })
        .populate('headMemberId', 'name phone photo')
        .sort(sortObj)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Family.countDocuments(filter),
    ]);

    // Enhance families with next payment due date calculations if missing
    const enhancedFamilies = families.map((f: any) => {
      let nextDue = f.nextPaymentDueDate;
      if (!nextDue && f.recurringDonationType && f.recurringDonationType !== 'none') {
        nextDue = calculateNextDueDate(f.recurringDonationType, f.recurringPaymentDay, f.recurringPaymentMonth, f.lastPaymentDate);
      }
      return {
        ...f,
        nextPaymentDueDate: nextDue,
      };
    });

    res.json({
      success: true,
      data: enhancedFamilies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    });
  } catch (e) { next(e); }
});

router.get('/:id', authorize(PERMISSIONS.FAMILY_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const family = await Family.findOne({ _id: req.params.id, tenantId: req.user!.tenantId })
      .populate('headMemberId members.memberId').lean();
    if (!family) throw new AppError('Family not found', 404);

    let nextDue = family.nextPaymentDueDate;
    if (!nextDue && family.recurringDonationType && family.recurringDonationType !== 'none') {
      nextDue = calculateNextDueDate(family.recurringDonationType, family.recurringPaymentDay, family.recurringPaymentMonth, family.lastPaymentDate);
    }

    res.json({ success: true, data: { ...family, nextPaymentDueDate: nextDue } });
  } catch (e) { next(e); }
});

router.post('/', authorize(PERMISSIONS.FAMILY_CREATE), async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const count = await Family.countDocuments({ tenantId });
    const familyCode = `FAM-${String(count + 1).padStart(4, '0')}`;
    const qrData = JSON.stringify({ familyCode, tenantId, type: 'family' });
    const qrCode = await QRCode.toDataURL(qrData);

    const recurringType = req.body.recurringDonationType;
    const recurringDay = req.body.recurringPaymentDay || 1;
    const recurringMonth = req.body.recurringPaymentMonth || 1;
    const nextPaymentDueDate = calculateNextDueDate(recurringType, recurringDay, recurringMonth);

    const family = await Family.create({
      ...req.body,
      tenantId,
      familyCode,
      qrCode,
      nextPaymentDueDate,
    });

    res.status(201).json({ success: true, data: family });
  } catch (e) { next(e); }
});

router.put('/:id', authorize(PERMISSIONS.FAMILY_UPDATE), async (req: AuthRequest, res, next) => {
  try {
    const body = { ...req.body };
    if (body.recurringDonationType !== undefined || body.recurringPaymentDay !== undefined || body.recurringPaymentMonth !== undefined) {
      body.nextPaymentDueDate = calculateNextDueDate(
        body.recurringDonationType,
        body.recurringPaymentDay,
        body.recurringPaymentMonth,
        body.lastPaymentDate
      );
    }

    const family = await Family.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user!.tenantId },
      { $set: body },
      { new: true }
    );
    if (!family) throw new AppError('Family not found', 404);
    res.json({ success: true, data: family });
  } catch (e) { next(e); }
});

router.delete('/:id', authorize(PERMISSIONS.FAMILY_DELETE), async (req: AuthRequest, res, next) => {
  try {
    await Family.findOneAndUpdate({ _id: req.params.id, tenantId: req.user!.tenantId }, { isDeleted: true, deletedAt: new Date() });
    res.json({ success: true, message: 'Family deleted' });
  } catch (e) { next(e); }
});

router.post('/:id/remind-recurring', authorize(PERMISSIONS.FAMILY_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const family = await Family.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
    if (!family) throw new AppError('Family not found', 404);
    
    if (!family.headMemberId) {
      throw new AppError('Family has no head member assigned to receive the alert', 400);
    }

    const { User } = await import('../models/User');
    const headUser = await User.findOne({ memberId: family.headMemberId, tenantId: family.tenantId });
    if (!headUser) {
      throw new AppError('Family head does not have a user account to receive alerts', 400);
    }

    const { Notification } = await import('../models/Notification');
    const { NotificationChannel } = await import('@mahallu/shared-types');

    const amountStr = family.recurringDonationAmount ? `₹${family.recurringDonationAmount}` : '';
    const typeStr = family.recurringDonationType ? `(${family.recurringDonationType})` : '';

    await Notification.create({
      tenantId: family.tenantId,
      channel: NotificationChannel.IN_APP,
      recipientId: headUser._id,
      title: 'Reminder: Recurring Donation Due',
      body: `Reminder: Your family recurring donation ${amountStr} ${typeStr} is due soon. Please clear your dues at your earliest convenience.`,
      status: 'pending',
    });

    res.json({ success: true, message: 'Reminder sent successfully' });
  } catch (e) { next(e); }
});

export default router;
