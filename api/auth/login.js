import { getDb } from './database.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, password } = req.body || {};
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码都是必需的' });
    }

    const db = getDb();
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // Generate simple token
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

    res.json({
      username: user.username,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}