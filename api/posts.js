import { getDb } from './database.js';

export default async function handler(req, res) {
  try {
    const db = getDb();
    
    if (req.method === 'GET') {
      const posts = await db.all('SELECT * FROM posts ORDER BY createdAt DESC');
      res.json(posts);
    } else if (req.method === 'POST') {
      const { id, title, content, summary, tags, author } = req.body;
      const createdAt = new Date().toISOString();
      
      await db.run(
        `INSERT INTO posts VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [id, title, content, summary, JSON.stringify(tags || []), createdAt, author]
      );
      
      res.status(201).json({ id, title, createdAt });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: '服务器错误: ' + error.message });
  }
}