import { getDb } from './database.js';

export default async function handler(req, res) {
  try {
    const db = await getDb();
    
    if (req.method === 'POST') {
      const { username, password } = req.body;
      const user = await db.get('SELECT * FROM users WHERE username = ?', username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Simple token (in production, use JWT)
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

      res.json({
        username: user.username,
        role: user.role,
        token
      });
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}