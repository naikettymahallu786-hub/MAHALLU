const mongoose = require('mongoose');

async function checkDB() {
  await mongoose.connect('mongodb://127.0.0.1:27017/mahallu');
  console.log('Connected to DB');

  const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));
  const Member = mongoose.model('Member', new mongoose.Schema({}, { strict: false }));
  const Class = mongoose.model('Class', new mongoose.Schema({}, { strict: false }));
  const Teacher = mongoose.model('Teacher', new mongoose.Schema({}, { strict: false }));

  const student = await Student.findOne({ admissionNo: 'ADM-2026-77SE' });
  if (!student) {
    console.log('Student not found with admission no ADM-2026-77SE');
    return process.exit(0);
  }

  console.log('Student:', {
    _id: student._id,
    admissionNo: student.admissionNo,
    classId: student.classId
  });

  const member = await Member.findOne({ _id: student.memberId });
  if (member) {
    console.log('Student Member Code:', member.memberId);
  }

  const cls = await Class.findOne({ _id: student.classId });
  if (!cls) {
    console.log('Class not found for student');
  } else {
    console.log('Class:', {
      _id: cls._id,
      name: cls.name,
      teacherId: cls.teacherId,
      schedule: cls.schedule
    });

    const teacher = await Teacher.findOne({ _id: cls.teacherId });
    if (teacher) {
      const teacherMember = await Member.findOne({ _id: teacher.memberId });
      console.log('Teacher Member Code:', teacherMember ? teacherMember.memberId : 'unknown');
    }
  }

  process.exit(0);
}

checkDB().catch(console.error);
