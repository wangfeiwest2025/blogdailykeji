
export interface Post {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  createdAt: string;
  author: string;
  views: number;
}

export interface User {
  username: string;
  isLoggedIn: boolean;
}

export interface BlogStats {
  totalVisits: number;
}
