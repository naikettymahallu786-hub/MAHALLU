import mongoose from 'mongoose';

const DonationSchema = new mongoose.Schema({
  tenantId: mongoose.Schema.Types.ObjectId,
  familyId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  campaign: String,
  purpose: String,
  status: String,
}, { timestamps: true });

const Donation = mongoose.model('Donation', DonationSchema);

async function run() {
  await mongoose.connect('mongodb+srv://sajalurahman321_db_user:WL5nBDCZFKsVUahn@cluster0.s6lu4m7.mongodb.net/test?appName=Cluster0');
  
  const familyId = '6a4f3ff161eaa27ae7e0144e';
  const tenantId = '6a4f33c6d6e0af2721332914';
  
  await Donation.create({
    tenantId: new mongoose.Types.ObjectId(tenantId),
    familyId: new mongoose.Types.ObjectId(familyId),
    amount: 1500,
    campaign: 'Recurring Donation',
    purpose: 'July 2026 Monthly Due',
    status: 'pending'
  });
  
  console.log('Test pending due inserted successfully!');
  await mongoose.disconnect();
}

run().catch(console.error);
