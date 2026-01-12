
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Post, User } from './types';
import { PostCard } from './components/PostCard';
import { generatePostMetadata } from './services/geminiService';

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
    edit: "编辑文章",
    save: "保存更改",
    cancel: "取消",
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
    edit: "Edit Post",
    save: "Save Changes",
    cancel: "Cancel",
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

  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('blog_posts');
    if (saved) return JSON.parse(saved);
    
    return [{
      id: '1',
      title: translations[lang].initialTitle,
      content: lang === 'zh' 
        ? '# 欢迎来到 dailykeji\n这里是技术与简约碰撞的地方。我们使用 Gemini AI 来整理和总结我们的想法。'
        : '# Welcome to dailykeji\nThis is where technology meets simplicity. We use Gemini AI to organize and summarize our thoughts.',
      summary: translations[lang].initialSummary,
      tags: ['welcome', 'tech', 'dailykeji'],
      createdAt: new Date().toISOString(),
      author: 'wangfei',
      views: 0
    }];
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
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const hasTracked = useRef(false);

  useEffect(() => {
    localStorage.setItem('blog_lang', lang);
  }, [lang]);

  useEffect(() => {
    if (hasTracked.current) return;
    const SESSION_VISIT_KEY = 'dailykeji_session_active_v5';
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
    if (loginInput.trim() === 'wangfei') {
      setUser({ username: 'wangfei', isLoggedIn: true });
      setLoginInput('');
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handlePostClick = (post: Post) => {
    const VIEWED_KEY = 'dailykeji_viewed_v5';
    const viewedIds = JSON.parse(sessionStorage.getItem(VIEWED_KEY) || '[]');
    
    if (!viewedIds.includes(post.id)) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, views: p.views + 1 } : p));
      viewedIds.push(post.id);
      sessionStorage.setItem(VIEWED_KEY, JSON.stringify(viewedIds));
      setSelectedPost({ ...post, views: post.views + 1 });
    } else {
      setSelectedPost(post);
    }
    setIsEditing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = () => {
    if (selectedPost) {
      setEditContent(selectedPost.content);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPost) return;
    setIsUploading(true);
    try {
      const metadata = await generatePostMetadata(editContent);
      const updatedPost = {
        ...selectedPost,
        content: editContent,
        summary: metadata.summary,
        tags: metadata.tags
      };
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? updatedPost : p));
      setSelectedPost(updatedPost);
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update post.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploading(true);
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
      setError('Upload failed.');
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
    <div className="min-h-screen flex flex-col selection:bg-blue-100 selection:text-blue-900 bg-gray-50/50 text-gray-900 font-sans">
      <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-between h-16 items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setSelectedPost(null); setIsEditing(false); }}>
            <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center transition-all group-hover:bg-blue-600">
              <span className="text-white font-black text-xl">D</span>
            </div>
            <div className="flex flex-col -space-y-1">
              <h1 className="text-xl font-black tracking-tighter">daily<span className="text-blue-600">keji</span></h1>
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t.logoDesc}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-full border border-gray-200">
              <button onClick={() => setLang('zh')} className={`px-3 py-1 text-[10px] font-black rounded-full transition-all ${lang === 'zh' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>中</button>
              <button onClick={() => setLang('en')} className={`px-3 py-1 text-[10px] font-black rounded-full transition-all ${lang === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>EN</button>
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none">{user.username}</p>
                  <button onClick={handleLogout} className="text-[9px] text-red-500 font-bold uppercase hover:underline">{t.logout}</button>
                </div>
                <div className="w-10 h-10 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="flex gap-2">
                <input type="text" placeholder={t.adminPlaceholder} value={loginInput} onChange={e => setLoginInput(e.target.value)} className="px-3 py-1.5 text-xs font-bold border rounded-xl w-24 focus:w-32 transition-all outline-none" />
                <button type="submit" className="bg-gray-900 text-white p-1.5 rounded-xl"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></button>
              </form>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          {selectedPost ? (
            <article className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <button onClick={() => { setSelectedPost(null); setIsEditing(false); }} className="flex items-center text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-[0.2em]">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  {t.return}
                </button>
                {user?.username === selectedPost.author && !isEditing && (
                  <button onClick={handleEdit} className="px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-xl hover:bg-blue-100 transition-all">{t.edit}</button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-6">
                  <textarea 
                    value={editContent} 
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full h-[500px] p-6 text-sm font-mono bg-gray-50 border-2 border-gray-100 rounded-3xl focus:border-blue-500 outline-none transition-all"
                  />
                  <div className="flex gap-4">
                    <button 
                      onClick={handleSaveEdit}
                      disabled={isUploading}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isUploading ? t.aiAnalyzing : t.save}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="px-8 bg-gray-100 text-gray-400 py-4 rounded-2xl font-black uppercase text-xs hover:bg-gray-200">{t.cancel}</button>
                  </div>
                </div>
              ) : (
                <>
                  <header className="mb-12">
                    <h2 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter leading-none mb-8">{selectedPost.title}</h2>
                    <div className="flex items-center gap-6 py-6 border-y border-gray-50">
                      <div>
                        <span className="block text-[8px] font-black text-gray-400 uppercase mb-1">{t.author}</span>
                        <span className="text-xs font-bold">@{selectedPost.author}</span>
                      </div>
                      <div className="w-px h-6 bg-gray-100" />
                      <div>
                        <span className="block text-[8px] font-black text-gray-400 uppercase mb-1">{t.impact}</span>
                        <span className="text-xs font-bold text-blue-600">{selectedPost.views} {t.reads}</span>
                      </div>
                    </div>
                  </header>
                  <div className="prose prose-blue max-w-none prose-p:leading-relaxed prose-img:rounded-3xl">
                    <div dangerouslySetInnerHTML={{ __html: selectedPost.content.replace(/\n/g, '<br/>') }} />
                  </div>
                </>
              )}
            </article>
          ) : (
            <div className="space-y-12">
              <h2 className="text-2xl font-black text-gray-900 border-b-4 border-gray-900 pb-4 uppercase tracking-tighter">{t.latest}</h2>
              {posts.length === 0 ? (
                <div className="py-32 text-center border-2 border-dashed rounded-[3rem] text-gray-300 font-black uppercase text-xs">{t.noArticles}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {posts.map(post => <PostCard key={post.id} post={post} onClick={handlePostClick} onDelete={deletePost} isOwner={user?.username === post.author} />)}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-8">{t.statsTitle}</h3>
            <div className="space-y-10">
              <div>
                <p className="text-5xl font-black tracking-tighter leading-none mb-2">{totalVisits.toLocaleString()}</p>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{t.sessions}</p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <p className="text-5xl font-black tracking-tighter leading-none mb-2">{totalArticleViews.toLocaleString()}</p>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{t.contentViews}</p>
              </div>
            </div>
          </div>

          {user?.username === 'wangfei' ? (
            <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
              <h3 className="text-[10px] font-black uppercase text-gray-400 mb-6">{t.publishing}</h3>
              <label className="w-full flex flex-col items-center py-12 bg-gray-50 border-4 border-dashed rounded-[2rem] cursor-pointer hover:border-blue-500 transition-all">
                {isUploading ? <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /> : (
                  <>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 mb-4 shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.uploadMd}</span>
                    <input type='file' className="hidden" accept=".md" onChange={handleFileUpload} disabled={isUploading} />
                  </>
                )}
              </label>
            </div>
          ) : (
            <div className="p-10 bg-white rounded-[2.5rem] border border-gray-100 text-center">
              <p className="text-[10px] font-black text-gray-900 uppercase">{t.restricted}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase">{t.loginToContribute}</p>
            </div>
          )}
        </aside>
      </main>

      <footer className="py-20 bg-white border-t mt-12 text-center">
        <span className="text-sm font-black tracking-tighter text-gray-900 uppercase">dailykeji &copy; {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
};

export default App;
