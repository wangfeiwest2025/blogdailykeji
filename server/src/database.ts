import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database | null = null;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: './blog.db',
      driver: sqlite3.Database
    });
    await initDb();
  }
  return db;
}

async function initDb() {
  await db!.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      tags TEXT,
      createdAt TEXT NOT NULL,
      author TEXT NOT NULL,
      views INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published'
    )
  `);

  await db!.exec(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user',
      createdAt TEXT NOT NULL
    )
  `);

  await db!.exec(`
    CREATE TABLE IF NOT EXISTS stats (
      key TEXT PRIMARY KEY,
      value INTEGER DEFAULT 0
    )
  `);

  // Insert default stats if not exists
  await db!.run(`
    INSERT OR IGNORE INTO stats (key, value) VALUES ('totalVisits', 0)
  `);

  // Insert default admin user if not exists
  await db!.run(`
    INSERT OR IGNORE INTO users (username, password, email, role, createdAt) 
    VALUES ('admin', 'admin123', 'admin@blog.com', 'admin', datetime('now'))
  `);
}