import 'dotenv/config';
import { connectDB } from '../config/database';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Member } from '../models/Member';
import { Family } from '../models/Family';
import { Madrasa } from '../models/Madrasa';
import { Settings } from '../models/Settings';
import { Student } from '../models/Student';
import { logger } from '../config/logger';
import { UserRole, Gender, MemberStatus } from '@mahallu/shared-types';
import mongoose from 'mongoose';

async function seed() {
  await connectDB();
  logger.info('🌱 Starting database seed...');

  // Clear existing data
  await Promise.all([
    Tenant.deleteMany({}),
    User.deleteMany({}),
    Member.deleteMany({}),
    Family.deleteMany({}),
    Madrasa.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  // 1. Create Tenant
  const tenant = await Tenant.create({
    name: 'Jamia Masjid Mahallu',
    mahalluCode: 'JMM001',
    phone: '+919876543210',
    email: 'admin@jamaiamasjid.in',
    address: {
      line1: 'Main Road, Near Masjid',
      city: 'Kozhikode',
      district: 'Kozhikode',
      state: 'Kerala',
      pincode: '673001',
      country: 'India',
    },
    settings: { language: 'ml', currency: 'INR', timezone: 'Asia/Kolkata', dateFormat: 'DD/MM/YYYY', prayerTimeMethod: '1' },
  });

  logger.info(`✅ Tenant created: ${tenant.name} (${tenant.mahalluCode})`);

  // 2. Create Super Admin User
  const superAdmin = await User.create({
    tenantId: tenant._id,
    name: 'System Administrator',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@mahallu.app',
    phone: '+919876543210',
    role: UserRole.SUPER_ADMIN,
    passwordHash: process.env.SEED_ADMIN_PASSWORD || 'Admin@123456',
    isActive: true,
  });

  logger.info(`✅ Super Admin created: ${superAdmin.email}`);

  // 3. Create Dedicated Madrasa Admin / Principal User
  const madrasaAdmin = await User.create({
    tenantId: tenant._id,
    name: 'Madrasa Administrator',
    email: 'madrasa.admin@mahallu.app',
    phone: '+919876543220',
    role: UserRole.MADRASA_PRINCIPAL,
    passwordHash: 'Madrasa@123456',
    isActive: true,
  });

  // 4. Create Sadar Mualim User
  const sadarUser = await User.create({
    tenantId: tenant._id,
    name: 'Sadar Mualim',
    email: 'sadar@mahallu.app',
    phone: '+919876543221',
    role: UserRole.SADAR_MUALIM,
    passwordHash: 'Sadar@123456',
    isActive: true,
  });

  logger.info(`✅ Dedicated Madrasa Admin & Sadar Mualim created: ${madrasaAdmin.email}, ${sadarUser.email}`);

  // 5. Create sample Members
  const members = await Member.create([
    {
      tenantId: tenant._id, memberId: 'MHL-2024-0001',
      name: 'Mohammed Rashid', nameML: 'മൊഹമ്മദ് റാഷിദ്',
      gender: Gender.MALE, phone: '+919876543211', status: MemberStatus.ACTIVE,
      occupation: 'Teacher', bloodGroup: 'B+',
      dateOfBirth: new Date('1985-03-15'),
    },
    {
      tenantId: tenant._id, memberId: 'MHL-2024-0002',
      name: 'Fathima Rashid', nameML: 'ഫാത്തിമ റാഷിദ്',
      gender: Gender.FEMALE, phone: '+919876543212', status: MemberStatus.ACTIVE,
      occupation: 'Homemaker',
      dateOfBirth: new Date('1988-07-22'),
    },
    {
      tenantId: tenant._id, memberId: 'MHL-2024-0003',
      name: 'Ahmed Haris', nameML: 'അഹ്മദ് ഹാരിസ്',
      gender: Gender.MALE, phone: '+919876543213', status: MemberStatus.ACTIVE,
      occupation: 'Business',
      dateOfBirth: new Date('1980-01-10'),
    },
  ]);

  logger.info(`✅ ${members.length} Members created`);

  // 6. Create sample Family
  const family = await Family.create({
    tenantId: tenant._id,
    familyCode: 'FAM-0001',
    headMemberId: members[0]._id,
    members: [
      { memberId: members[0]._id, relationship: 'Head', isHead: true },
      { memberId: members[1]._id, relationship: 'Spouse', isHead: false },
    ],
    address: {
      line1: '12/A, Green Lane',
      city: 'Kozhikode',
      district: 'Kozhikode',
      state: 'Kerala',
      pincode: '673001',
      country: 'India',
      gps: { type: 'Point', coordinates: [75.7804, 11.2588] },
    },
    wardNo: 'Ward 5',
    outstandingBalance: 0,
  });

  // Update members with family
  await Member.updateMany({ _id: { $in: [members[0]._id, members[1]._id] } }, { familyId: family._id });

  logger.info(`✅ Family created: ${family.familyCode}`);

  // 7. Create Secretary User
  await User.create({
    tenantId: tenant._id,
    name: 'Ibrahim Secretary',
    email: 'secretary@mahallu.app',
    phone: '+919876543214',
    role: UserRole.SECRETARY,
    passwordHash: 'Secretary@123',
    memberId: members[2]._id,
    isActive: true,
  });

  // 8. Create Treasurer User
  await User.create({
    tenantId: tenant._id,
    name: 'Kareem Treasurer',
    email: 'treasurer@mahallu.app',
    phone: '+919876543215',
    role: UserRole.TREASURER,
    passwordHash: 'Treasurer@123',
    isActive: true,
  });

  // 9. Create Madrasa
  const madrasa = await Madrasa.create({
    tenantId: tenant._id,
    name: 'Darul Uloom Madrasa',
    address: {
      line1: 'Madrasa Complex',
      city: 'Kozhikode',
      district: 'Kozhikode',
      state: 'Kerala',
      pincode: '673001',
      country: 'India',
    },
    phone: '+919876543216',
    principalId: madrasaAdmin._id as any,
    subjects: ['Quran', 'Tajweed', 'Arabic', 'Fiqh', 'Hadith', 'Aqeedah', 'Malayalam'],
    academicYear: '2024-2025',
  });

  logger.info(`✅ Madrasa created: ${madrasa.name}`);

  // 10. Create Settings
  await Settings.create({
    tenantId: tenant._id,
    general: {
      mahalluName: tenant.name,
      phone: tenant.phone,
      email: tenant.email,
      address: `${tenant.address.city}, Kerala`,
    },
    notifications: { whatsappEnabled: false, smsEnabled: false, emailEnabled: true, pushEnabled: true },
    finance: { currency: 'INR', financialYearStart: 'April', autoReceiptEnabled: true },
    theme: { primaryColor: '#059669', mode: 'system', language: 'ml' },
  });

  // 11. Create Parent User
  await User.create({
    tenantId: tenant._id,
    name: 'Mohammed Rashid (Parent)',
    email: 'parent@mahallu.app',
    phone: '+919876543211',
    role: UserRole.PARENT,
    passwordHash: 'Parent@123',
    memberId: members[0]._id,
    isActive: true,
  });

  // 12. Create Student and Student User
  await Student.create({
    tenantId: tenant._id,
    memberId: members[2]._id,
    admissionNo: 'ADM-2024-001',
    admissionDate: new Date(),
    classId: new mongoose.Types.ObjectId(),
    madrasaId: madrasa._id,
    guardianId: members[0]._id,
    status: 'active',
  });

  await User.create({
    tenantId: tenant._id,
    name: 'Ahmed Haris (Student)',
    email: 'student@mahallu.app',
    phone: '+919876543213',
    role: UserRole.STUDENT,
    passwordHash: 'Student@123',
    memberId: members[2]._id,
    isActive: true,
  });

  logger.info('🎉 Database seeded successfully!');
  logger.info('📋 Dedicated Madrasa Credentials:');
  logger.info('   Madrasa Admin: madrasa.admin@mahallu.app / Madrasa@123456');
  logger.info('   Sadar Mualim:   sadar@mahallu.app / Sadar@123456');
  logger.info('   Mahallu Code:  JMM001');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
