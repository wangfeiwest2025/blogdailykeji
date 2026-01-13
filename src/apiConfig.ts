// API configuration for different environments
const API_CONFIG = {
  // Production: Vercel serverless functions
  production: {
    baseUrl: '',
    posts: '/api/posts',
    upload: '/api/upload',
    auth: '/api/auth/login',
    stats: '/api/stats'
  },
  // Development: local backend server
  development: {
    baseUrl: 'http://localhost:3007',
    posts: 'http://localhost:3007/api/posts',
    upload: 'http://localhost:3007/api/upload',
    auth: 'http://localhost:3007/api/auth/login',
    stats: 'http://localhost:3007/api/stats'
  }
};

export function getApiConfig() {
  const isBrowser = typeof window !== 'undefined';
  const isProduction = isBrowser && window.location.hostname !== 'localhost';
  return API_CONFIG[isProduction ? 'production' : 'development'];
}

export function getPostDetailUrl(id: string) {
  const config = getApiConfig();
  return `${config.baseUrl}/api/posts/${id}`;
}

export function getPostViewUrl(id: string) {
  const config = getApiConfig();
  return `${config.baseUrl}/api/posts/${id}/view`;
}