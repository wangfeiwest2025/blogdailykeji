import { getDb } from './database.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { title, content, filename } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: '标题和内容都是必需的' });
    }

    // Generate summary from content
    const summary = content
      .replace(/[#*`]/g, '')
      .slice(0, 100)
      .trim() + '...';
    
    const tags = ['markdown', 'blog', 'upload'];
    const id = `post-${Date.now()}`;
    const author = 'wangfei';
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
      message: '文章发布成功'
    });
  } catch (error) {
    console.error('Upload API error:', error);
    res.status(500).json({ error: '服务器错误，上传失败' });
  }
}