import { getDb } from './database.js';

export default async function handler(req, res) {
  try {
    const db = await getDb();
    const { id } = req.query;
    
    if (req.method === 'GET') {
      const post = await db.get('SELECT * FROM posts WHERE id = ?', id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      post.tags = JSON.parse(post.tags || '[]');
      res.json(post);
    } else if (req.method === 'PUT') {
      const { title, content, summary, tags } = req.body;
      await db.run(
        `UPDATE posts SET title = ?, content = ?, summary = ?, tags = ? WHERE id = ?`,
        [title, content, summary, JSON.stringify(tags || []), id]
      );
      res.json({ success: true });
    } else if (req.method === 'DELETE') {
      await db.run('DELETE FROM posts WHERE id = ?', id);
      res.json({ success: true });
    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Post API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}