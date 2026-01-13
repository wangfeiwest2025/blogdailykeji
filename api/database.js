import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db = null;

export async function getDb() {
  if (!db) {
    // Use '/tmp' for Vercel serverless environment
    const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/blogdailykeji.db' : './blogdailykeji.db';
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Initialize tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        tags TEXT,
        createdAt TEXT NOT NULL,
        author TEXT,
        views INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT,
        email TEXT,
        role TEXT DEFAULT 'user',
        createdAt TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS stats (
        key TEXT PRIMARY KEY,
        value INTEGER DEFAULT 0
      );
    `);

    // Insert default user if not exists
    await db.run(`
      INSERT OR IGNORE INTO users (username, password, email, role, createdAt)
      VALUES ('wangfei', 'wangfei', 'admin@dailykeji.com', 'admin', datetime('now'))
    `);

    // Insert default stats if not exists
    await db.run(`
      INSERT OR IGNORE INTO stats (key, value)
      VALUES ('totalVisits', 0)
    `);
  }

  return db;
}