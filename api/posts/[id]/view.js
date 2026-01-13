import { getDb } from './database.js';

export default async function handler(req, res) {
  try {
    const db = await getDb();
    const { id } = req.query;
    
    if (req.method === 'POST') {
      await db.run('UPDATE posts SET views = views + 1 WHERE id = ?', id);
      res.json({ success: true });
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('View API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}