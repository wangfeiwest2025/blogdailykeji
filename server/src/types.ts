export interface Post {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  createdAt: string;
  author: string;
  views: number;
  status: 'published' | 'draft';
}

export interface User {
  username: string;
  password: string;
  email?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface AuthUser {
  username: string;
  role: string;
  token?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface BlogStats {
  totalVisits: number;
  totalArticleViews: number;
  totalPosts: number;
  totalUsers: number;
}