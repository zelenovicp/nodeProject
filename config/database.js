const { Database } = require('sqlite-async');

const dbName = 'project.db';
let dbInstance = null;

async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = await Database.open(dbName);

  await initTables(dbInstance);

  return dbInstance;
}
async function initTables(db) {
  // Users
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL
    );
  `);

  // Exercises
  await db.run(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      duration INTEGER NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

module.exports =  { getDb };