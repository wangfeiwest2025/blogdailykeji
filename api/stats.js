import { getDb } from './database.js';

export default async function handler(req, res) {
  try {
    const db = getDb();
    
    if (req.method === 'GET') {
      const posts = await db.all('SELECT * FROM posts');
      const totalArticleViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
      
      res.json({ 
        totalVisits: 100,
        totalArticleViews,
        totalPosts: posts.length,
        totalUsers: 1
      });
    } else if (req.method === 'POST') {
      res.json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}