const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  console.log('Using MONGODB_URI:', process.env.MONGODB_URI);
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected successfully to:', conn.connection.host);
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
}

test();
