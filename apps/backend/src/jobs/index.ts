import cron from 'node-cron';
import { logger } from '../config/logger';
import { Subscription } from '../models/Subscription';
import { Student } from '../models/Student';
import dayjs from 'dayjs';

export function initializeCronJobs(): void {
  // Daily at 9AM — check overdue subscriptions
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running: Overdue subscription check');
    try {
      const overdue = await Subscription.updateMany(
        { status: 'active', dueDate: { $lt: new Date() } },
        { $set: { status: 'overdue' } },
      );
      logger.info(`Marked ${overdue.modifiedCount} subscriptions as overdue`);
    } catch (error) {
      logger.error('Cron error (subscription check):', error);
    }
  });

  // Monthly on 1st — generate subscription dues
  cron.schedule('0 8 1 * *', async () => {
    logger.info('Running: Monthly subscription generation');
    // Generate next month subscription dues
  });

  // Daily at 8AM — fee reminder (students with balance > 0)
  cron.schedule('0 8 * * MON', async () => {
    logger.info('Running: Weekly fee reminder check');
    try {
      const students = await Student.find({ status: 'active', feeBalance: { $gt: 0 } })
        .populate('guardianId', 'phone')
        .lean();
      logger.info(`Found ${students.length} students with outstanding fees`);
      // Trigger WhatsApp/SMS notifications here
    } catch (error) {
      logger.error('Cron error (fee reminder):', error);
    }
  });

  // Daily at 12:05 AM — Family Recurring Donations Billing
  cron.schedule('5 0 * * *', async () => {
    logger.info('Running: Family recurring donations evaluation');
    try {
      const now = new Date();
      const isFirstOfMonth = now.getDate() === 1;
      const isJanFirst = isFirstOfMonth && now.getMonth() === 0;

      if (isFirstOfMonth) {
        // Query families that need to be billed today
        const query: any = {
          isDeleted: { $ne: true },
          recurringDonationAmount: { $gt: 0 }
        };

        if (isJanFirst) {
          // On Jan 1st, bill both monthly and yearly
          query.recurringDonationType = { $in: ['monthly', 'yearly'] };
        } else {
          // Otherwise, only bill monthly
          query.recurringDonationType = 'monthly';
        }

        const { Family } = await import('../models/Family');
        const { User } = await import('../models/User');
        const { Notification } = await import('../models/Notification');
        const { Donation } = await import('../models/Donation');
        const { NotificationChannel } = await import('@mahallu/shared-types');

        const familiesToBill = await Family.find(query);
        logger.info(`Found ${familiesToBill.length} families to bill for recurring donations.`);

        let billedCount = 0;
        const monthName = now.toLocaleString('default', { month: 'long' });
        const year = now.getFullYear();

        for (const family of familiesToBill) {
          try {
            const amount = family.recurringDonationAmount;
            
            // Create a pending donation (due) record
            await Donation.create({
              tenantId: family.tenantId,
              familyId: family._id,
              amount: amount,
              campaign: 'Recurring Donation',
              purpose: `${family.recurringDonationType === 'monthly' ? monthName : ''} ${year} Due`.trim(),
              status: 'pending',
              dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 0) // Last day of month
            });

            // Increment balance
            await Family.updateOne(
              { _id: family._id },
              { $inc: { outstandingBalance: amount } }
            );

            // Send Notification
            if (family.headMemberId) {
              const headUser = await User.findOne({ memberId: family.headMemberId, tenantId: family.tenantId });
              if (headUser) {
                await Notification.create({
                  tenantId: family.tenantId,
                  channel: NotificationChannel.IN_APP,
                  recipientId: headUser._id,
                  title: 'Recurring Donation Due',
                  body: `Your ${family.recurringDonationType} recurring donation of ${amount} has been added to your dues. Please clear your balance.`,
                  status: 'pending',
                });
              }
            }
            billedCount++;
          } catch (err) {
            logger.error(`Failed to bill family ${family._id}`, err);
          }
        }
        logger.info(`Successfully billed ${billedCount} families for recurring donations.`);
      }
    } catch (error) {
      logger.error('Cron error (recurring donations):', error);
    }
  });

  logger.info('✅ Cron jobs initialized');
}
