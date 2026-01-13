import { getDb } from './database.js';

export default async function handler(req, res) {
  try {
    const db = await getDb();
    
    if (req.method === 'GET') {
      const totalVisitsRow = await db.get('SELECT value FROM stats WHERE key = ?', 'totalVisits');
      const totalVisits = totalVisitsRow?.value || 0;
      const posts = await db.all('SELECT views FROM posts');
      const totalArticleViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
      const totalPosts = posts.length;
      const users = await db.get('SELECT COUNT(*) as count FROM users');
      const totalUsers = users?.count || 0;
      
      res.json({ 
        totalVisits, 
        totalArticleViews, 
        totalPosts, 
        totalUsers 
      });
    } else if (req.method === 'POST') {
      await db.run('UPDATE stats SET value = value + 1 WHERE key = ?', 'totalVisits');
      res.json({ success: true });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}