const mongoose = require('mongoose');

async function checkClass() {
  const uri = 'mongodb+srv://sajalurahman321_db_user:WL5nBDCZFKsVUahn@cluster0.s6lu4m7.mongodb.net/?appName=Cluster0';
  await mongoose.connect(uri);

  const Class = mongoose.model('Class', new mongoose.Schema({}, { strict: false }));
  
  const cls = await Class.findOne({ _id: new mongoose.Types.ObjectId('6a4f93818a35780e54c0fa0d') });
  if (cls) {
    console.log('Class found:', cls.name);
    console.log('Class schedule:', cls.schedule);
  } else {
    console.log('Class not found!');
  }

  process.exit(0);
}

checkClass().catch(console.error);
