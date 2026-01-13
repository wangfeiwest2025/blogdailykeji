import { getDb } from './database.js';

export default async function handler(req, res) {
  try {
    const db = await getDb();
    
    // Insert some sample posts if database is empty
    const existingPosts = await db.get('SELECT COUNT(*) as count FROM posts');
    
    if (existingPosts.count === 0) {
      const samplePosts = [
        {
          id: 'welcome-dailykeji',
          title: '欢迎来到 dailykeji',
          content: '# 欢迎来到 dailykeji\n\n这里是技术与简约碰撞的地方。\n\n## 特性\n\n- 📝 Markdown 支持\n- 🎨 简约设计\n- 📱 响应式布局\n- 🚀 快速加载',
          summary: '一个欢迎来到 dailykeji 博客平台的友好介绍。',
          tags: JSON.stringify(['welcome', 'tech', 'dailykeji']),
          author: 'wangfei',
          createdAt: new Date().toISOString()
        },
        {
          id: 'final-integration-test',
          title: 'Final Integration Test',
          content: '# Final Integration Test\n\nThis is a test post to verify the integration between frontend and backend.\n\n## Testing Features\n\n- ✅ API connectivity\n- ✅ Database operations\n- ✅ Post management\n- ✅ User authentication',
          summary: 'Testing the complete integration of frontend and backend systems.',
          tags: JSON.stringify(['test', 'integration', 'backend']),
          author: 'wangfei',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      for (const post of samplePosts) {
        await db.run(
          `INSERT INTO posts (id, title, content, summary, tags, createdAt, author, views)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
          [post.id, post.title, post.content, post.summary, post.tags, post.createdAt, post.author]
        );
      }
    }

    res.json({ 
      message: 'Database initialized successfully',
      postsCount: samplePosts?.length || 0
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}