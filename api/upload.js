import { getDb } from './database.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Handle both JSON and multipart data
    let title, content, filename;
    
    if (req.body && req.body.title && req.body.content) {
      // JSON data from Vercel
      title = req.body.title;
      content = req.body.content;
      filename = req.body.filename;
    } else {
      // Fallback - not supported in serverless
      return res.status(400).json({ error: '请发送JSON格式数据' });
    }

    if (!title || !content) {
      return res.status(400).json({ error: '标题和内容都是必需的' });
    }

    // Generate summary
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
    console.error('Upload error:', error);
    res.status(500).json({ error: '服务器错误，上传失败' });
  }
}