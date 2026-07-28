import mongoose from 'mongoose';

const uri1 = 'mongodb+srv://naikettymahallu786_db_user:OSWACbHxxDhRdiId@cluster0.abqvshq.mongodb.net/mahallu-erp?retryWrites=true&w=majority&appName=Cluster0';
const uri2 = 'mongodb+srv://sajalurahman321_db_user:WL5nBDCZFKsVUahn@cluster0.s6lu4m7.mongodb.net/test?appName=Cluster0';
const uri3 = 'mongodb+srv://sajalurahman321_db_user:WL5nBDCZFKsVUahn@cluster0.s6lu4m7.mongodb.net/mahallu-erp?appName=Cluster0';
const uri4 = 'mongodb://127.0.0.1:27017/mahallu';

async function inspect(uri: string, label: string) {
  console.log(`\n--- Inspecting ${label} ---`);
  try {
    const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 }).asPromise();
    console.log('Connected!');
    
    // List databases
    const admin = conn.db!.admin();
    const dbs = await admin.listDatabases();
    console.log('Databases available:', dbs.databases.map((d: any) => d.name));

    // For current connection db, list collections and document counts
    const collections = await conn.db!.listCollections().toArray();
    console.log(`Collections in current db (${conn.name}):`);
    for (const col of collections) {
      const count = await conn.db!.collection(col.name).countDocuments();
      if (count > 0) {
        console.log(`  - ${col.name}: ${count} documents`);
      }
    }
    await conn.close();
  } catch (err: any) {
    console.error(`Failed to connect/inspect ${label}:`, err.message);
  }
}

async function run() {
  await inspect(uri1, 'URI 1 (naikettymahallu786 - mahallu-erp)');
  await inspect(uri2, 'URI 2 (sajalurahman321 - default/test)');
  await inspect(uri3, 'URI 3 (sajalurahman321 - mahallu-erp)');
  await inspect(uri4, 'URI 4 (local - mahallu)');
  process.exit(0);
}

run();
