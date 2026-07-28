import mongoose from 'mongoose';
import { Member } from './models/Member';
import { Family } from './models/Family';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function syncFamilies() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mahallu');
    console.log('Connected to MongoDB');

    const membersWithFamilies = await Member.find({ familyId: { $exists: true, $ne: null } });
    console.log(`Found ${membersWithFamilies.length} members with a familyId.`);

    let synced = 0;
    for (const member of membersWithFamilies) {
      const family = await Family.findById(member.familyId);
      if (family) {
        const isMemberInFamily = family.members.some(
          (fm: any) => fm.memberId && fm.memberId.toString() === member._id.toString()
        );

        if (!isMemberInFamily) {
          console.log(`Syncing member ${member.memberId} to family ${family.familyCode}`);
          family.members.push({
            memberId: member._id,
            relationship: member.relationship || 'Member',
            isHead: false,
          });
          await family.save();
          synced++;
        }
      }
    }

    console.log(`Synced ${synced} missing members into their family arrays.`);
  } catch (error) {
    console.error('Error syncing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

syncFamilies();
