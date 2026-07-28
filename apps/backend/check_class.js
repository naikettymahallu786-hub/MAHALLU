const mongoose = require('mongoose');

async function checkDB() {
  await mongoose.connect('mongodb://127.0.0.1:27017/mahallu');

  const Class = mongoose.model('Class', new mongoose.Schema({}, { strict: false }));
  
  // Find all classes
  const classes = await Class.find({});
  
  console.log(`Found ${classes.length} classes:`);
  
  for (const cls of classes) {
    console.log(`\nClass: ${cls.name}`);
    console.log(`Schedule length: ${cls.schedule ? cls.schedule.length : 0}`);
    if (cls.schedule && cls.schedule.length > 0) {
      console.log('Schedule details:', JSON.stringify(cls.schedule, null, 2));
    }
  }

  process.exit(0);
}

checkDB().catch(console.error);
