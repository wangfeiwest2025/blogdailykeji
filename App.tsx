
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Post, User } from './types';
import { PostCard } from './components/PostCard';
import { generatePostMetadata } from './services/geminiService';

// 本地 i18n 字典
const translations = {
  zh: {
    logoDesc: "数据驱动博客",
    latest: "最新内容",
    noArticles: "暂无文章",
    statsTitle: "全站统计",
    sessions: "累计访问",
    contentViews: "文章阅读",
    publishing: "发布工具",
    uploadMd: "上传 MD 文件",
    restricted: "受限访问",
    loginToContribute: "登录后开始创作",
    return: "返回列表",
    author: "作者",
    impact: "影响力",
    reads: "次阅读",
    logout: "退出登录",
    adminPlaceholder: "管理员账号",
    aiAnalyzing: "AI 分析中...",
    deleteConfirm: "确定要永久删除吗？",
    initialTitle: "你好 dailykeji 世界",
    initialSummary: "一个欢迎来到 dailykeji 博客平台的友好介绍，由 Gemini AI 驱动。",
  },
  en: {
    logoDesc: "Analytics Driven Blog",
    latest: "Latest Content",
    noArticles: "No articles found",
    statsTitle: "Site Statistics",
    sessions: "Sessions Tracked",
    contentViews: "Total Content Views",
    publishing: "Publishing Tool",
    uploadMd: "Upload MD",
    restricted: "Restricted Access",
    loginToContribute: "Login to contribute",
    return: "Back to List",
    author: "Author",
    impact: "Impact",
    reads: "Reads",
    logout: "Logout",
    adminPlaceholder: "Admin",
    aiAnalyzing: "AI Analyzing...",
    deleteConfirm: "Delete permanently?",
    initialTitle: "Hello dailykeji World",
    initialSummary: "A friendly introduction to the dailykeji blog platform, powered by Gemini AI.",
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<'zh' | 'en'>(() => {
    const saved = localStorage.getItem('blog_lang');
    return (saved as 'zh' | 'en') || 'zh';
  });

  const t = useMemo(() => translations[lang], [lang]);

  const INITIAL_POSTS: Post[] = [
    {
      id: '1',
      title: t.initialTitle,
      content: lang === 'zh' 
        ? '# 欢迎来到 dailykeji\n这里是技术与简约碰撞的地方。我们使用 Gemini AI 来整理和总结我们的想法。'
        : '# Welcome to dailykeji\nThis is where technology meets simplicity. We use Gemini AI to organize and summarize our thoughts.',
      summary: t.initialSummary,
      tags: ['welcome', 'tech', 'dailykeji'],
      createdAt: new Date().toISOString(),
      author: 'wangfei',
      views: 0
    }
  ];

  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('blog_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });
  
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('blog_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [totalVisits, setTotalVisits] = useState<number>(() => {
    const saved = localStorage.getItem('blog_total_visits');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [loginInput, setLoginInput] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const hasTracked = useRef(false);

  useEffect(() => {
    localStorage.setItem('blog_lang', lang);
  }, [lang]);

  useEffect(() => {
    if (hasTracked.current) return;
    const SESSION_VISIT_KEY = 'dailykeji_v4_session_active';
    const isSessionActive = sessionStorage.getItem(SESSION_VISIT_KEY);
    if (!isSessionActive) {
      setTotalVisits(prev => {
        const newTotal = prev + 1;
        localStorage.setItem('blog_total_visits', newTotal.toString());
        return newTotal;
      });
      sessionStorage.setItem(SESSION_VISIT_KEY, 'true');
    }
    hasTracked.current = true;
  }, []);

  useEffect(() => {
    localStorage.setItem('blog_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('blog_user', JSON.stringify(user));
  }, [user]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const username = loginInput.trim();
    if (username === 'wangfei') {
      setUser({ username, isLoggedIn: true });
      setLoginInput('');
      setError(null);
    } else {
      setLoginInput('');
      setError(null);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handlePostClick = (post: Post) => {
    const VIEWED_POSTS_KEY = 'dailykeji_v4_viewed_ids';
    const viewedIdsString = sessionStorage.getItem(VIEWED_POSTS_KEY) || '[]';
    const viewedIds = JSON.parse(viewedIdsString) as string[];

    let currentViews = post.views;

    if (!viewedIds.includes(post.id)) {
      const updatedPosts = posts.map(p => {
        if (p.id === post.id) {
          const newViews = (p.views || 0) + 1;
          currentViews = newViews;
          return { ...p, views: newViews };
        }
        return p;
      });
      setPosts(updatedPosts);
      viewedIds.push(post.id);
      sessionStorage.setItem(VIEWED_POSTS_KEY, JSON.stringify(viewedIds));
    }
    
    setSelectedPost({ ...post, views: currentViews });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.name.endsWith('.md')) {
      setError(lang === 'zh' ? '格式错误，请使用 .md' : 'Invalid format. Please use .md');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const text = await file.text();
      const metadata = await generatePostMetadata(text);
      const newPost: Post = {
        id: Date.now().toString(),
        title: file.name.replace('.md', '').replace(/[-_]/g, ' '),
        content: text,
        summary: metadata.summary,
        tags: metadata.tags,
        createdAt: new Date().toISOString(),
        author: user.username,
        views: 0
      };
      setPosts(prev => [newPost, ...prev]);
    } catch (err) {
      setError('AI Analysis failed.');
      console.error(err);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const deletePost = (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      setPosts(prev => prev.filter(p => p.id !== id));
      if (selectedPost?.id === id) setSelectedPost(null);
    }
  };

  const totalArticleViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-100 selection:text-blue-900 bg-gray-50/50 text-gray-900">
      <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedPost(null)}>
              <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center transition-all group-hover:bg-blue-600">
                <span className="text-white font-black text-xl">D</span>
              </div>
              <div className="flex flex-col -space-y-1">
                <h1 className="text-xl font-black tracking-tighter">daily<span className="text-blue-600">keji</span></h1>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t.logoDesc}</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* 语言切换开关 */}
              <div className="flex items-center bg-gray-100 p-1 rounded-full border border-gray-200">
                <button 
                  onClick={() => setLang('zh')}
                  className={`px-3 py-1 text-[10px] font-black rounded-full transition-all ${lang === 'zh' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  中
                </button>
                <button 
                  onClick={() => setLang('en')}
                  className={`px-3 py-1 text-[10px] font-black rounded-full transition-all ${lang === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  EN
                </button>
              </div>

              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none">{user.username}</p>
                    <button onClick={handleLogout} className="text-[9px] text-red-500 font-bold uppercase hover:underline">{t.logout}</button>
                  </div>
                  <div className="w-10 h-10 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={t.adminPlaceholder}
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="px-4 py-2 text-xs font-bold border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-28 bg-gray-50/50"
                    required
                  />
                  <button type="submit" className="bg-gray-900 text-white p-2 rounded-xl hover:bg-black transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            {selectedPost ? (
              <article className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white rounded-[2.5rem] p-8 sm:p-12 border border-gray-100 shadow-sm">
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="mb-10 flex items-center text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-[0.2em]"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  {t.return}
                </button>
                <header className="mb-12">
                  <h2 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter leading-none mb-8">{selectedPost.title}</h2>
                  <div className="flex flex-wrap items-center gap-6 py-6 border-y border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.author}</span>
                      <span className="text-xs font-bold text-gray-900">@{selectedPost.author}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-100" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.impact}</span>
                      <span className="text-xs font-bold text-blue-600">{selectedPost.views.toLocaleString()} {t.reads}</span>
                    </div>
                  </div>
                </header>
                <div className="prose prose-lg max-w-none prose-p:leading-relaxed prose-blue">
                   <div dangerouslySetInnerHTML={{ __html: selectedPost.content.replace(/\n/g, '<br/>') }} />
                </div>
              </article>
            ) : (
              <div className="space-y-12">
                <div className="flex items-center justify-between border-b-4 border-gray-900 pb-4">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">{t.latest}</h2>
                </div>
                
                {posts.length === 0 ? (
                  <div className="py-32 text-center border-2 border-dashed border-gray-200 rounded-[3rem] bg-white text-gray-300 font-bold uppercase tracking-widest text-xs">
                    {t.noArticles}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {posts.map(post => (
                      <PostCard 
                        key={post.id} 
                        post={post} 
                        onClick={handlePostClick}
                        onDelete={deletePost}
                        isOwner={user?.username === post.author}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-500 mb-10">{t.statsTitle}</h3>
              <div className="space-y-10 relative z-10">
                <div>
                  <p className="text-5xl font-black tracking-tighter tabular-nums leading-none mb-2">{totalVisits.toLocaleString()}</p>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{t.sessions}</p>
                </div>
                <div className="h-px bg-white/10 w-full" />
                <div>
                  <p className="text-5xl font-black tracking-tighter tabular-nums leading-none mb-2">{totalArticleViews.toLocaleString()}</p>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{t.contentViews}</p>
                </div>
              </div>
            </div>

            {user ? (
              <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8">{t.publishing}</h3>
                <label className="w-full flex flex-col items-center px-6 py-14 bg-gray-50 border-4 border-dashed border-gray-100 rounded-[2rem] cursor-pointer hover:border-blue-500 transition-all">
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                      <span className="text-[9px] font-black uppercase text-blue-600">{t.aiAnalyzing}</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-400 mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t.uploadMd}</span>
                      <input type='file' className="hidden" accept=".md" onChange={handleFileUpload} disabled={isUploading} />
                    </>
                  )}
                </label>
              </div>
            ) : (
              <div className="p-10 bg-white rounded-[2.5rem] border border-gray-100 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">{t.restricted}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{t.loginToContribute}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-24 bg-white border-t border-gray-50 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="text-lg font-black tracking-tighter text-gray-900">dailykeji</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
