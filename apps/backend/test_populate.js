const mongoose = require('mongoose');

async function testPopulate() {
  const uri = 'mongodb+srv://sajalurahman321_db_user:WL5nBDCZFKsVUahn@cluster0.s6lu4m7.mongodb.net/?appName=Cluster0';
  await mongoose.connect(uri);

  const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));
  const Class = mongoose.model('Class', new mongoose.Schema({}, { strict: false }));

  const student = await Student.findOne({ admissionNo: 'ADM-2026-77SE' })
    .populate('classId', 'name schedule')
    .lean();

  console.log('classId after populate:', student.classId);

  process.exit(0);
}

testPopulate().catch(console.error);
