const mongoose = require('mongoose');

async function checkRemote() {
  const uri = 'mongodb+srv://sajalurahman321_db_user:WL5nBDCZFKsVUahn@cluster0.s6lu4m7.mongodb.net/?appName=Cluster0';
  await mongoose.connect(uri);

  const Teacher = mongoose.model('Teacher', new mongoose.Schema({}, { strict: false }));
  const Member = mongoose.model('Member', new mongoose.Schema({}, { strict: false }));
  
  const teacherMember = await Member.findOne({ memberId: 'MHL-2026-4DTI' });
  if (!teacherMember) {
    console.log('Teacher Member not found.');
    process.exit(0);
  }

  const teacher = await Teacher.findOne({ memberId: teacherMember._id });
  if (!teacher) {
    console.log('Teacher record not found.');
    process.exit(0);
  }

  console.log('Teacher schedule:', JSON.stringify(teacher.schedule, null, 2));

  process.exit(0);
}

checkRemote().catch(console.error);
