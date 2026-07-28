import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Member } from '../models/Member';
import { Family } from '../models/Family';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { Payment } from '../models/Payment';
import { Donation } from '../models/Donation';
import { Attendance } from '../models/Attendance';
import { Transaction } from '../models/Transaction';
import { PaymentType, PaymentStatus, AttendanceStatus } from '@mahallu/shared-types';
import dayjs from 'dayjs';

export class DashboardController {
  static async getKPIs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.user!.tenantId);
      const currentMonth = dayjs().startOf('month').toDate();
      const lastMonth = dayjs().subtract(1, 'month').startOf('month').toDate();
      const currentMonthEnd = dayjs().endOf('month').toDate();

      const [
        totalFamilies,
        totalMembers,
        activeStudents,
        activeTeachers,
        monthlyIncome,
        monthlyExpenses,
        pendingFees,
        monthlyDonations,
        zakatCollected,
        txIncome,
        txExpense,
      ] = await Promise.all([
        Family.countDocuments({ tenantId }),
        Member.countDocuments({ tenantId, status: 'active' }),
        Student.countDocuments({ tenantId, status: 'active' }),
        Teacher.countDocuments({ tenantId, status: 'active' }),
        Payment.aggregate([
          {
            $match: {
              tenantId,
              status: PaymentStatus.SUCCESS,
              createdAt: { $gte: currentMonth, $lte: currentMonthEnd },
              type: { $in: [PaymentType.SUBSCRIPTION, PaymentType.DONATION, PaymentType.RENTAL, PaymentType.ZAKAT] },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Payment.aggregate([
          {
            $match: {
              tenantId,
              status: PaymentStatus.SUCCESS,
              createdAt: { $gte: currentMonth, $lte: currentMonthEnd },
              type: { $in: [PaymentType.SALARY, PaymentType.MAINTENANCE] },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Student.aggregate([
          { $match: { tenantId, status: 'active' } },
          { $group: { _id: null, total: { $sum: '$feeBalance' } } },
        ]),
        Donation.aggregate([
          { $match: { tenantId, createdAt: { $gte: currentMonth, $lte: currentMonthEnd } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Payment.aggregate([
          { $match: { tenantId, type: PaymentType.ZAKAT, status: PaymentStatus.SUCCESS } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Transaction.aggregate([
          { $match: { tenantId, type: 'INCOME', date: { $gte: currentMonth, $lte: currentMonthEnd } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Transaction.aggregate([
          { $match: { tenantId, type: 'EXPENSE', date: { $gte: currentMonth, $lte: currentMonthEnd } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalFamilies,
          totalMembers,
          activeStudents,
          activeTeachers,
          monthlyIncome: (monthlyIncome[0]?.total || 0) + (txIncome[0]?.total || 0),
          monthlyExpenses: (monthlyExpenses[0]?.total || 0) + (txExpense[0]?.total || 0),
          pendingFees: pendingFees[0]?.total || 0,
          monthlyDonations: monthlyDonations[0]?.total || 0,
          zakatCollected: zakatCollected[0]?.total || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getIncomeExpenseChart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.user!.tenantId);
      const last6Months = dayjs().subtract(6, 'month').startOf('month').toDate();

      const [paymentData, txData] = await Promise.all([
        Payment.aggregate([
          {
            $match: {
              tenantId,
              status: PaymentStatus.SUCCESS,
              createdAt: { $gte: last6Months },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                isExpense: {
                  $in: ['$type', [PaymentType.SALARY, PaymentType.MAINTENANCE]],
                },
              },
              total: { $sum: '$amount' },
            },
          },
        ]),
        Transaction.aggregate([
          { $match: { tenantId, date: { $gte: last6Months } } },
          {
            $group: {
              _id: {
                year: { $year: '$date' },
                month: { $month: '$date' },
                isExpense: { $eq: ['$type', 'EXPENSE'] },
              },
              total: { $sum: '$amount' },
            },
          },
        ])
      ]);

      // Combine
      const mergedMap = new Map<string, any>();
      [...paymentData, ...txData].forEach(item => {
        const key = `${item._id.year}-${item._id.month}-${item._id.isExpense}`;
        if (mergedMap.has(key)) {
          mergedMap.get(key).total += item.total;
        } else {
          mergedMap.set(key, { ...item });
        }
      });

      const data = Array.from(mergedMap.values()).sort((a, b) => {
        if (a._id.year !== b._id.year) return a._id.year - b._id.year;
        return a._id.month - b._id.month;
      });

      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getAttendanceChart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.user!.tenantId);
      const last30Days = dayjs().subtract(30, 'days').toDate();

      const data = await Attendance.aggregate([
        { $match: { tenantId, entityType: 'student', date: { $gte: last30Days } } },
        {
          $group: {
            _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, status: '$status' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]);

      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getMemberGrowthChart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.user!.tenantId);
      const last12Months = dayjs().subtract(12, 'month').startOf('month').toDate();

      const data = await Member.aggregate([
        { $match: { tenantId, createdAt: { $gte: last12Months } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getRecentActivity(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId; // Mongoose find() casts string to ObjectId automatically

      const [recentMembers, recentPayments, recentDonations] = await Promise.all([
        Member.find({ tenantId }).sort({ createdAt: -1 }).limit(5).select('name memberId photo createdAt').lean(),
        Payment.find({ tenantId, status: PaymentStatus.SUCCESS })
          .sort({ createdAt: -1 }).limit(5)
          .populate('paidById', 'name').lean(),
        Donation.find({ tenantId }).sort({ createdAt: -1 }).limit(5)
          .populate('donorId', 'name').lean(),
      ]);

      res.status(200).json({
        success: true,
        data: { recentMembers, recentPayments, recentDonations },
      });
    } catch (error) {
      next(error);
    }
  }
}
