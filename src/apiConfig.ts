// API configuration for different environments
export const API_CONFIG = {
  // Production: Vercel serverless functions (relative paths)
  production: {
    baseUrl: '',
    posts: '/api/posts',
    auth: '/api/auth/login',
    upload: '/api/upload',
    stats: '/api/stats'
  },
  // Development: local backend server
  development: {
    baseUrl: 'http://localhost:3007',
    posts: 'http://localhost:3007/api/posts',
    auth: 'http://localhost:3007/api/auth/login',
    upload: 'http://localhost:3007/api/upload',
    stats: 'http://localhost:3007/api/stats'
  }
};

export const getApiConfig = () => {
  // Check if we're in browser environment
  const isBrowser = typeof window !== 'undefined';
  const isProduction = process.env.NODE_ENV === 'production' || 
                      (isBrowser && window.location.hostname !== 'localhost');
  return API_CONFIG[isProduction ? 'production' : 'development'];
};

export const createApiUrl = (endpoint: string, id?: string) => {
  const config = getApiConfig();
  let url = config[endpoint];
  if (id) {
    url = `${config.baseUrl}/api/posts/${id}`;
  }
  return url;
};