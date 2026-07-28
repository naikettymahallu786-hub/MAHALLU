import mongoose from 'mongoose';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Settings } from '../models/Settings';
import { logger } from '../config/logger';
import { UserRole } from '@mahallu/shared-types';

const REMOTE_URI = 'mongodb+srv://sajalurahman321_db_user:WL5nBDCZFKsVUahn@cluster0.s6lu4m7.mongodb.net/test?appName=Cluster0';

async function clearRemoteDatabase() {
  logger.info('⚠️ Connecting to remote MongoDB database...');
  
  mongoose.set('strictQuery', false);
  
  try {
    await mongoose.connect(REMOTE_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('✅ Connected to remote MongoDB.');
  } catch (err: any) {
    logger.error('Failed to connect to remote MongoDB:', err.message);
    process.exit(1);
  }

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established.');
  }

  // Drop the database to completely wipe all collections, indexes, and documents
  logger.info(`Wiping remote database: ${db.databaseName}...`);
  await db.dropDatabase();
  logger.info('✅ Remote database dropped successfully.');

  logger.info('Re-establishing database schema on remote...');

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
    email: 'admin@mahallu.app',
    phone: '+919876543210',
    role: UserRole.SUPER_ADMIN,
    passwordHash: 'Admin@123456',
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
  logger.info('🎉 Remote database wiped and reset successfully! All remote users, families, and other data were cleared, except for the basic admin accounts.');
  logger.info('📋 Admin Login Credentials:');
  logger.info('   Super Admin:   admin@mahallu.app / Admin@123456');
  logger.info('   Madrasa Admin: madrasa.admin@mahallu.app / Madrasa@123456');
  logger.info('   Sadar Mualim:  sadar@mahallu.app / Sadar@123456');

  await mongoose.disconnect();
  process.exit(0);
}

clearRemoteDatabase().catch((err) => {
  logger.error('❌ Remote reset failed:', err);
  process.exit(1);
});
