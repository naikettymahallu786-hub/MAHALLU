import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { Donation } from '../models/Donation';
import { AuthRequest } from '../middleware/auth';
import { Family } from '../models/Family';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { NotificationChannel } from '@mahallu/shared-types';
const r = Router();
r.use(authenticate);
r.get('/', authorize(PERMISSIONS.DONATION_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 20, campaign } = req.query;
    const pageNum = parseInt(page as string), limitNum = parseInt(limit as string);
    const filter: Record<string, unknown> = { tenantId: req.user!.tenantId };
    if (campaign) filter.campaign = campaign;
    const [donations, total] = await Promise.all([
      Donation.find(filter).populate('donorId', 'name phone').populate({ path: 'familyId', select: 'familyCode headMemberId', populate: { path: 'headMemberId', select: 'name' } }).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Donation.countDocuments(filter),
    ]);
    res.json({ success: true, data: donations, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (e) { next(e); }
});
r.post('/', authorize(PERMISSIONS.DONATION_CREATE), async (req: AuthRequest, res, next) => {
  try {
    const { amount, campaign, familyId, donorName, isAnonymous, gateway } = req.body;
    const tenantId = req.user!.tenantId;
    const isFamilyDue = !!familyId && !gateway; // If familyId is provided but no gateway, it's a pending due.

    const d = await Donation.create({ 
      tenantId,
      amount,
      campaign,
      familyId: familyId || undefined,
      donorName,
      isAnonymous,
      status: isFamilyDue ? 'pending' : 'paid'
    });

    if (isFamilyDue) {
      // Find the family and increment its outstanding balance
      const family = await Family.findOneAndUpdate(
        { _id: familyId, tenantId },
        { $inc: { outstandingBalance: amount } },
        { new: true }
      );
      
      if (family && family.headMemberId) {
        // Find the user account for the family head
        const headUser = await User.findOne({ memberId: family.headMemberId, tenantId });
        
        if (headUser) {
          // Create in-app notification
          await Notification.create({
            tenantId,
            channel: NotificationChannel.IN_APP,
            recipientId: headUser._id,
            title: 'New Due Added',
            body: `A new due of ${amount} for ${campaign || 'General Donation'} has been added to your family account. Please pay at your earliest convenience.`,
            status: 'pending',
          });
        }
      }
    } else if (gateway) {
      // If payment is collected immediately (Cash / GPay)
      const { Payment } = await import('../models/Payment');
      const { Receipt } = await import('../models/Receipt');

      const count = await Payment.countDocuments({ tenantId });
      const paymentNo = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

      // Resolve who is paying
      let paidById: any = req.user!.userId; // Default to admin recording it
      if (familyId) {
        const family = await Family.findById(familyId).lean();
        if (family && family.headMemberId) {
          paidById = family.headMemberId;
        }
      }

      const payment = await Payment.create({
        tenantId, paymentNo, type: 'donation', amount,
        paidById,
        paidForId: familyId ? paidById : undefined,
        gateway: gateway.toLowerCase(),
        status: 'success', description: campaign || 'Direct Donation',
      });

      const receiptCount = await Receipt.countDocuments({ tenantId });
      const receiptNo = `RCP-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(6, '0')}`;
      const receipt = await Receipt.create({ tenantId, receiptNo, paymentId: payment._id });
      await Payment.findByIdAndUpdate(payment._id, { receiptId: receipt._id });

      // Link donation to payment
      d.paymentId = payment._id;
      await d.save();

      // If familyId was provided, also decrement the balance since they paid instantly
      // (Actually, if they pay instantly, it doesn't affect outstandingBalance, but just in case, we don't increment it)
    }

    res.status(201).json({ success: true, data: d });
  } catch (e) { 
    next(e); 
  }
});
r.post('/:id/collect', authorize(PERMISSIONS.DONATION_CREATE), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { gateway = 'cash', amount, description } = req.body;
    const tenantId = req.user!.tenantId;

    const donation = await Donation.findOne({ _id: id, tenantId });
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (donation.status === 'paid' || !donation.status) {
      return res.status(400).json({ success: false, message: 'Donation is already paid' });
    }

    const collectAmount = amount || donation.amount;

    const { Payment } = await import('../models/Payment');
    const { Receipt } = await import('../models/Receipt');

    const count = await Payment.countDocuments({ tenantId });
    const paymentNo = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    // Resolve who is paying
    let paidById: any = req.user!.userId;
    if (donation.familyId) {
      const family = await Family.findById(donation.familyId).lean();
      if (family && family.headMemberId) {
        paidById = family.headMemberId;
      }
    } else if (donation.donorId) {
      paidById = donation.donorId;
    }

    const payment = await Payment.create({
      tenantId, paymentNo, type: 'donation', amount: collectAmount,
      paidById,
      paidForId: donation.familyId ? paidById : undefined,
      gateway: gateway.toLowerCase(),
      status: 'success', description: description || donation.campaign || 'Collected Donation Dues',
    });

    const receiptCount = await Receipt.countDocuments({ tenantId });
    const receiptNo = `RCP-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(6, '0')}`;
    const receipt = await Receipt.create({ tenantId, receiptNo, paymentId: payment._id });
    await Payment.findByIdAndUpdate(payment._id, { receiptId: receipt._id });

    // Mark donation as paid
    donation.status = 'paid';
    donation.paymentId = payment._id;
    await donation.save();

    // Decrement the family's outstanding balance
    if (donation.familyId) {
      await Family.findByIdAndUpdate(donation.familyId, {
        $inc: { outstandingBalance: -collectAmount }
      });
    }

    res.json({ success: true, message: 'Donation collected successfully', data: { donation, payment, receipt } });
  } catch (e) { next(e); }
});

export default r;
