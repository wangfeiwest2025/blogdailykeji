import { getDb } from './database.js';

export default async function handler(req, res) {
  try {
    const db = await getDb();
    
    if (req.method === 'GET') {
      const posts = await db.all('SELECT * FROM posts ORDER BY createdAt DESC');
      res.json(posts.map(p => ({
        ...p,
        tags: JSON.parse(p.tags || '[]')
      })));
    } else if (req.method === 'POST') {
      const { id, title, content, summary, tags, author } = req.body;
      const createdAt = new Date().toISOString();
      
      await db.run(
        `INSERT INTO posts (id, title, content, summary, tags, createdAt, author, views)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [id, title, content, summary, JSON.stringify(tags || []), createdAt, author]
      );
      
      res.status(201).json({ id, title, createdAt });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Posts API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}