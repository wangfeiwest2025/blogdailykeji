// Simple in-memory storage for Vercel serverless
let posts = [
  {
    id: 'welcome-dailykeji',
    title: '欢迎来到 dailykeji',
    content: '# 欢迎来到 dailykeji\n\n这里是技术与简约碰撞的地方。\n\n## 特性\n\n- 📝 Markdown 支持\n- 🎨 简约设计\n- 📱 响应式布局\n- 🚀 快速加载',
    summary: '一个欢迎来到 dailykeji 博客平台的友好介绍。',
    tags: ['welcome', 'tech', 'dailykeji'],
    createdAt: new Date().toISOString(),
    author: 'wangfei',
    views: 42
  },
  {
    id: 'integration-test',
    title: 'Integration Test Complete',
    content: '# Integration Test Complete\n\n✅ Frontend and backend are fully integrated!\n\n## Features\n\n- Post management\n- User authentication\n- File uploads\n- View tracking\n\n---\n\nYour blog is now live! 🎉',
    summary: 'Testing complete integration of frontend and backend.',
    tags: ['test', 'integration', 'success'],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    author: 'wangfei',
    views: 15
  }
];

let users = [
  { username: 'wangfei', password: 'wangfei', email: 'admin@dailykeji.com', role: 'admin', createdAt: new Date().toISOString() }
];

let stats = { totalVisits: 100 };

export function getDb() {
  return {
    all: async (query) => {
      console.log('DB query:', query);
      if (query.includes('posts')) {
        return posts.map(p => ({ ...p, tags: JSON.stringify(p.tags) }));
      }
      return [{ count: users.length }];
    },
    get: async (query, params) => {
      if (query.includes('posts') && params) {
        const post = posts.find(p => p.id === params);
        return post ? { ...post, tags: JSON.stringify(post.tags) } : null;
      }
      if (query.includes('users')) {
        return users.find(u => u.username === params);
      }
      if (query.includes('stats')) {
        return { value: stats.totalVisits };
      }
      return null;
    },
    run: async (query, params) => {
      console.log('DB run:', query, params);
      if (query.includes('INSERT') && query.includes('posts')) {
        posts.unshift({
          id: params[0],
          title: params[1],
          content: params[2],
          summary: params[3],
          tags: JSON.parse(params[4] || '[]'),
          createdAt: params[5],
          author: params[6],
          views: 0
        });
      }
      if (query.includes('UPDATE') && query.includes('views') && params) {
        const post = posts.find(p => p.id === params[0]);
        if (post) post.views++;
      }
      if (query.includes('UPDATE') && query.includes('posts') && params) {
        const post = posts.find(p => p.id === params[4]);
        if (post) {
          post.title = params[0];
          post.content = params[1];
          post.summary = params[2];
          post.tags = JSON.parse(params[3] || '[]');
        }
      }
      if (query.includes('DELETE') && params) {
        posts = posts.filter(p => p.id !== params[0]);
      }
      if (query.includes('stats')) {
        stats.totalVisits++;
      }
      return { changes: 1 };
    }
  };
}