const mongoose = require('mongoose');

async function testStudentApi() {
  const uri = 'mongodb+srv://sajalurahman321_db_user:WL5nBDCZFKsVUahn@cluster0.s6lu4m7.mongodb.net/?appName=Cluster0';
  await mongoose.connect(uri);

  const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));
  const Member = mongoose.model('Member', new mongoose.Schema({}, { strict: false }));
  const Teacher = mongoose.model('Teacher', new mongoose.Schema({}, { strict: false }));

  // Find the student member
  const userMember = await Member.findOne({ memberId: 'MHL-2026-7PKA' }).lean();
  if (!userMember) {
    console.log('Member not found');
    return process.exit(0);
  }

  // Simulate GET /mobile/me/student logic
  const student = await Student.findOne({ memberId: userMember._id }).lean();
  if (!student) {
    console.log('Student not found');
    return process.exit(0);
  }

  // Find the teacher that has this student assigned
  const teacher = await Teacher.findOne({ assignedStudents: student._id }).lean();
  
  if (!student.classId) student.classId = {};
  
  if (teacher && teacher.schedule && (!student.classId.schedule)) {
    console.log('Attaching teacher schedule to student classId');
    student.classId.schedule = teacher.schedule;
    student.classId.name = student.classId.name || 'Directly Assigned';
  }

  console.log('Student classId:', JSON.stringify(student.classId, null, 2));

  if (teacher) {
    console.log('Teacher schedule:', JSON.stringify(teacher.schedule, null, 2));
  } else {
    console.log('Teacher not found for this student');
  }

  process.exit(0);
}

testStudentApi().catch(console.error);
