import 'dotenv/config';
import { connectDB } from '../config/database';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Settings } from '../models/Settings';
import { logger } from '../config/logger';
import { UserRole } from '@mahallu/shared-types';
import mongoose from 'mongoose';

async function clearDatabase() {
  await connectDB();
  logger.info('⚠️ Starting database wipe and reset...');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established.');
  }

  // Drop the database to completely wipe all collections, indexes, and documents
  logger.info(`Dropping database: ${db.databaseName}...`);
  await db.dropDatabase();
  logger.info('✅ Database dropped successfully.');

  // Re-connect to ensure all collections/indexes are re-registered by Mongoose models
  logger.info('Re-establishing database schema...');

  // 1. Create a clean Tenant
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
    settings: {
      language: 'ml',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      prayerTimeMethod: '1',
    },
  });

  logger.info(`✅ Tenant created: ${tenant.name} (${tenant.mahalluCode})`);

  // 2. Create Super Admin User (so you can still log in)
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

  // 3. Create Madrasa Admin / Principal User
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

  logger.info(`✅ Madrasa Admin & Sadar Mualim created: ${madrasaAdmin.email}, ${sadarUser.email}`);

  // 5. Create default Settings
  await Settings.create({
    tenantId: tenant._id,
    general: {
      mahalluName: tenant.name,
      phone: tenant.phone,
      email: tenant.email,
      address: `${tenant.address.city}, Kerala`,
    },
    notifications: {
      whatsappEnabled: false,
      smsEnabled: false,
      emailEnabled: true,
      pushEnabled: true,
    },
    finance: {
      currency: 'INR',
      financialYearStart: 'April',
      autoReceiptEnabled: true,
    },
    theme: {
      primaryColor: '#059669',
      mode: 'system',
      language: 'ml',
    },
  });

  logger.info('✅ Default settings configured.');
  logger.info('🎉 Database wiped and reset successfully! All users, families, and other data were cleared, except for the basic admin accounts.');
  logger.info('📋 Admin Login Credentials:');
  logger.info('   Super Admin:   admin@mahallu.app / Admin@123456 (or your custom SEED_ADMIN credentials in .env)');
  logger.info('   Madrasa Admin: madrasa.admin@mahallu.app / Madrasa@123456');
  logger.info('   Sadar Mualim:  sadar@mahallu.app / Sadar@123456');

  await mongoose.disconnect();
  process.exit(0);
}

clearDatabase().catch((err) => {
  logger.error('❌ Reset failed:', err);
  process.exit(1);
});
