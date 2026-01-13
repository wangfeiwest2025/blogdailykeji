import { getDb } from './database.js';

export default async function handler(req, res) {
  try {
    const db = getDb();
    const { id } = req.query || {};
    
    if (req.method === 'POST' && id) {
      await db.run('UPDATE posts SET views = views + 1 WHERE id = ?', id);
      res.json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('View API error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}