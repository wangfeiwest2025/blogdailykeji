import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join as pathJoin } from 'path';
import { getDb } from './database';
import { Post, User, AuthUser, BlogStats } from './types';

const execAsync = promisify(exec);

const app = express();
const port = process.env.PORT || 3005;
const upload = multer({ dest: 'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Git operations
async function commitToGit(filename: string, title: string) {
  try {
    console.log(`Attempting to commit ${filename} to git...`);
    
    // Git operations should run from parent directory (project root)
    const projectRoot = pathJoin(process.cwd(), '..');
    
    // Check if we're in a git repository
    await execAsync('git status', { cwd: projectRoot });
    
    // Add uploaded file to git (relative to project root)
    const gitAddCommand = `git add server/posts/${filename}`;
    await execAsync(gitAddCommand, { cwd: projectRoot });
    
    // Create commit with meaningful message
    const commitMessage = `Add new blog post: ${title}`;
    await execAsync(`git commit -m "${commitMessage}"`, { cwd: projectRoot });
    
    console.log(`Successfully committed server/posts/${filename} to git`);
    return true;
  } catch (error: any) {
    console.error('Git operation failed:', error.message);
    // Don't fail the upload if git operations fail
    return false;
  }
}

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3006'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Authentication middleware
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    (req as any).user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      username: user.username,
      role: user.role,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const db = await getDb();
    
    // Check if user already exists
    const existingUser = await db.get('SELECT username FROM users WHERE username = ?', username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    await db.run(
      'INSERT INTO users (username, password, email, role, createdAt) VALUES (?, ?, ?, ?, ?)',
      [username, password, email, 'user', new Date().toISOString()]
    );

    res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get('SELECT username, email, role, createdAt FROM users WHERE username = ?', req.user?.username);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const db = await getDb();
    const posts = await db.all('SELECT * FROM posts ORDER BY createdAt DESC');
    res.json(posts.map(p => ({
      ...p,
      tags: JSON.parse(p.tags || '[]')
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single post by id
app.get('/api/posts/:id', async (req, res) => {
  try {
    const db = await getDb();
    const post = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    post.tags = JSON.parse(post.tags || '[]');
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new post
app.post('/api/posts', async (req, res) => {
  try {
    const { id, title, content, summary, tags, author } = req.body;
    const createdAt = new Date().toISOString();
    const db = await getDb();
    await db.run(
      `INSERT INTO posts (id, title, content, summary, tags, createdAt, author, views)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, title, content, summary, JSON.stringify(tags || []), createdAt, author]
    );
    res.status(201).json({ id, title, createdAt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update post
app.put('/api/posts/:id', async (req, res) => {
  try {
    const { title, content, summary, tags } = req.body;
    const db = await getDb();
    await db.run(
      `UPDATE posts SET title = ?, content = ?, summary = ?, tags = ? WHERE id = ?`,
      [title, content, summary, JSON.stringify(tags || []), req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM posts WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Increment views
app.post('/api/posts/:id/view', async (req, res) => {
  try {
    const db = await getDb();
    await db.run('UPDATE posts SET views = views + 1 WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const db = await getDb();
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Increment total visits
app.post('/api/stats/visit', async (req, res) => {
  try {
    const db = await getDb();
    await db.run('UPDATE stats SET value = value + 1 WHERE key = ?', 'totalVisits');
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin routes for user management
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.all('SELECT username, email, role, createdAt FROM users ORDER BY createdAt DESC');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/users/:username', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM users WHERE username = ?', req.params.username);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload markdown file and create post
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Only process .md files
    if (!req.file.originalname.endsWith('.md')) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'Only .md files are allowed' });
    }
    
    const content = await fs.readFile(req.file.path, 'utf-8');
    const filename = req.file.originalname;
    const title = req.file.originalname.replace('.md', '').replace(/[-_]/g, ' ');
    
    // Save the file to posts directory
    const postsDir = path.join(process.cwd(), 'posts');
    try {
      await fs.access(postsDir);
    } catch {
      await fs.mkdir(postsDir, { recursive: true });
    }
    
    const filePath = path.join(postsDir, filename);
    await fs.writeFile(filePath, content);
    
    // Generate metadata
    const summary = content.slice(0, 100).replace(/[#*`]/g, '') + '...';
    const tags = ['markdown', 'blog', 'upload'];
    const id = `post-${Date.now()}`;
    const author = 'admin';
    const createdAt = new Date().toISOString();

    // Save to database
    const db = await getDb();
    await db.run(
      `INSERT INTO posts (id, title, content, summary, tags, createdAt, author, views)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, title, content, summary, JSON.stringify(tags), createdAt, author]
    );

    // Clean up uploaded temp file
    await fs.unlink(req.file.path);

    // Commit to git
    const gitSuccess = await commitToGit(filename, title);

    res.status(201).json({ 
      id, 
      title, 
      summary,
      gitCommitted: gitSuccess,
      message: gitSuccess ? 'Post uploaded and committed to git successfully' : 'Post uploaded (git commit failed)'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});