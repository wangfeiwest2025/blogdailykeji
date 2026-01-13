import { getDb } from './database.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    // For Vercel, we'll handle the content directly instead of file upload
    const { title, content, filename } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const summary = content.slice(0, 100).replace(/[#*`]/g, '') + '...';
    const tags = ['markdown', 'blog', 'upload'];
    const id = `post-${Date.now()}`;
    const author = 'admin';
    const createdAt = new Date().toISOString();

    const db = await getDb();
    await db.run(
      `INSERT INTO posts (id, title, content, summary, tags, createdAt, author, views)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, title, content, summary, JSON.stringify(tags), createdAt, author]
    );

    res.status(201).json({ 
      id, 
      title, 
      summary,
      gitCommitted: false, // Git operations not available in Vercel
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error('Upload API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}