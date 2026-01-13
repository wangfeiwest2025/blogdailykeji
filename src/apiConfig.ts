// API configuration for different environments
const API_CONFIG = {
  // Production: Vercel serverless functions
  production: {
    baseUrl: '',
    posts: '/api/posts',
    postDetail: (id) => `/api/posts/${id}`,
    postView: (id) => `/api/posts/${id}/view`,
    auth: '/api/auth/login',
    upload: '/api/upload',
    stats: '/api/stats'
  },
  // Development: local backend server
  development: {
    baseUrl: 'http://localhost:3007',
    posts: 'http://localhost:3007/api/posts',
    postDetail: (id) => `http://localhost:3007/api/posts/${id}`,
    postView: (id) => `http://localhost:3007/api/posts/${id}/view`,
    auth: 'http://localhost:3007/api/auth/login',
    upload: 'http://localhost:3007/api/upload',
    stats: 'http://localhost:3007/api/stats'
  }
};

export const getApiConfig = () => {
  const isBrowser = typeof window !== 'undefined';
  const isProduction = isBrowser && window.location.hostname !== 'localhost';
  return API_CONFIG[isProduction ? 'production' : 'development'];
};

export const getApiUrl = (endpoint, id?) => {
  const config = getApiConfig();
  if (id) {
    return config.postDetail(id);
  }
  return config[endpoint] || config.posts;
};