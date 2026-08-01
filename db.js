const { MongoClient } = require('mongodb');

let client;
let database;

function mongoUri() {
  return process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL || '';
}

async function getDb() {
  if (database) return database;
  const uri = mongoUri();
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error('MongoDB configuration is missing. Set MONGODB_URI in Hostinger.');
  }
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  database = client.db(process.env.MONGODB_DATABASE || 'projectmanager');
  await database.collection('users').createIndex({ email: 1 }, { unique: true });
  await database.collection('projects').createIndex({ user_id: 1 });
  await database.collection('projects').createIndex({ 'collaborators.user_id': 1 });
  return database;
}

async function checkDatabase() {
  const db = await getDb();
  await db.command({ ping: 1 });
  return true;
}

module.exports = { getDb, checkDatabase, mongoUri };
