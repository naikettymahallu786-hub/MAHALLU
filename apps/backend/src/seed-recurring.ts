import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Family } from './models/Family';

dotenv.config();

async function seedRecurring() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    const families = await Family.find({ isDeleted: { $ne: true } }).limit(5);

    if (families.length < 2) {
      console.log('Not enough families to seed. Please create families first.');
      process.exit(0);
    }

    // Assign Monthly to first 2 families
    for (let i = 0; i < 2; i++) {
      families[i].recurringDonationType = 'monthly';
      families[i].recurringDonationAmount = 500;
      families[i].outstandingBalance = 1500; // Unpaid (3 months due)
      await families[i].save();
      console.log(`Updated ${families[i].familyCode} to Monthly (Unpaid 1500)`);
    }

    // Assign Yearly to next 2 families
    for (let i = 2; i < 4 && i < families.length; i++) {
      families[i].recurringDonationType = 'yearly';
      families[i].recurringDonationAmount = 12000;
      families[i].outstandingBalance = 0; // Paid
      await families[i].save();
      console.log(`Updated ${families[i].familyCode} to Yearly (Paid)`);
    }

    console.log('✅ Seeding recurring donations completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding recurring donations:', err);
    process.exit(1);
  }
}

seedRecurring();
