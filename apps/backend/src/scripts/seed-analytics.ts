import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Payment } from '../models/Payment';
import { Member } from '../models/Member';
import { Attendance } from '../models/Attendance';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { PaymentType, PaymentStatus, PaymentGateway, AttendanceStatus, MemberStatus, Gender } from '@mahallu/shared-types';
import dayjs from 'dayjs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI as string;

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const tenant = await Tenant.findOne();
    if (!tenant) throw new Error('No tenant found');
    const tenantId = tenant._id;

    const user = await User.findOne({ tenantId });
    if (!user) throw new Error('No user found');
    const adminId = user._id;

    // Get an existing member
    let member = await Member.findOne({ tenantId });
    if (!member) {
      member = await Member.create({
        tenantId,
        memberId: 'M-TEST-1',
        name: 'Test Member',
        gender: Gender.MALE,
        phone: '1234567890',
        status: MemberStatus.ACTIVE
      });
    }

    // --- Seed Payments (Income & Expenses for last 6 months) ---
    console.log('Seeding Payments...');
    const paymentsToInsert = [];
    for (let i = 0; i < 6; i++) {
      const monthDate = dayjs().subtract(i, 'month').startOf('month').add(15, 'days'); // Middle of the month
      
      // Income (Subscription)
      paymentsToInsert.push({
        tenantId,
        paymentNo: `PAY-INC-${Date.now()}-${i}`,
        type: PaymentType.SUBSCRIPTION,
        amount: Math.floor(Math.random() * 20000) + 30000, // 30k to 50k
        paidById: member._id,
        gateway: PaymentGateway.CASH,
        status: PaymentStatus.SUCCESS,
        createdAt: monthDate.toDate()
      });

      // Expense (Salary)
      paymentsToInsert.push({
        tenantId,
        paymentNo: `PAY-EXP-${Date.now()}-${i}`,
        type: PaymentType.SALARY,
        amount: Math.floor(Math.random() * 10000) + 20000, // 20k to 30k
        paidById: member._id,
        gateway: PaymentGateway.CASH,
        status: PaymentStatus.SUCCESS,
        createdAt: monthDate.toDate()
      });
    }
    await Payment.insertMany(paymentsToInsert);
    console.log(`Inserted ${paymentsToInsert.length} payments.`);

    // --- Seed Member Growth (Change createdAt of some existing members, or create new ones) ---
    console.log('Seeding Member Growth...');
    for (let i = 0; i < 6; i++) {
      const numMembers = Math.floor(Math.random() * 10) + 5; // 5 to 15 per month
      const monthDate = dayjs().subtract(i, 'month').startOf('month').add(10, 'days').toDate();
      for (let j = 0; j < numMembers; j++) {
        await Member.create({
          tenantId,
          memberId: `M-SEED-${i}-${j}-${Date.now()}`,
          name: `Seeded Member ${i}-${j}`,
          gender: Gender.MALE,
          phone: `99999${i}${j}${Date.now().toString().slice(-3)}`,
          status: MemberStatus.ACTIVE,
          createdAt: monthDate
        });
      }
    }
    console.log(`Inserted random members for past 6 months.`);

    // --- Seed Attendance for last 30 days ---
    console.log('Seeding Attendance...');
    let student = await Student.findOne({ tenantId });
    if (!student) {
      // Just mock one
      student = (await Student.create({
        tenantId,
        studentId: 'STU-TEST-1',
        memberId: member._id,
        admissionDate: new Date(),
        status: 'active',
        feeBalance: 0
      })) as any;
    }

    const attendanceToInsert = [];
    for (let i = 0; i < 30; i++) {
      const d = dayjs().subtract(i, 'days').toDate();
      // Skip Sundays if you want, but random is fine
      if (d.getDay() === 0) continue; 
      
      const isPresent = Math.random() > 0.15; // 85% attendance
      attendanceToInsert.push({
        tenantId,
        entityType: 'student',
        entityId: student!._id,
        date: dayjs(d).startOf('day').toDate(),
        status: isPresent ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
        markedById: adminId
      });
    }
    
    // Clean old mocked attendance for this student to avoid unique index errors
    await Attendance.deleteMany({ tenantId, entityId: student!._id });
    await Attendance.insertMany(attendanceToInsert);
    console.log(`Inserted ${attendanceToInsert.length} attendance records.`);

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding:', err);
    process.exit(1);
  }
}

seed();
