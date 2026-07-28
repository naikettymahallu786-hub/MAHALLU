const mongoose = require('mongoose');

async function checkRemote() {
  const uri = 'mongodb+srv://sajalurahman321_db_user:WL5nBDCZFKsVUahn@cluster0.s6lu4m7.mongodb.net/?appName=Cluster0';
  await mongoose.connect(uri);

  const Class = mongoose.model('Class', new mongoose.Schema({}, { strict: false }));
  const Member = mongoose.model('Member', new mongoose.Schema({}, { strict: false }));
  const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));

  const studentMember = await Member.findOne({ memberId: 'MHL-2026-7PKA' });
  if (!studentMember) {
    console.log('Student Member not found.');
    process.exit(0);
  }

  const student = await Student.findOne({ memberId: studentMember._id });
  if (!student) {
    console.log('Student record not found.');
    process.exit(0);
  }

  const cls = await Class.findOne({ _id: student.classId });
  if (!cls) {
    console.log('Class not found for student.');
  } else {
    console.log('Class:', cls.name);
    console.log('Schedule:', JSON.stringify(cls.schedule, null, 2));
  }

  process.exit(0);
}

checkRemote().catch(console.error);
