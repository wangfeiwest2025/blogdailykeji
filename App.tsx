
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Post, User } from './types';
import { PostCard } from './components/PostCard';

const translations = {
  zh: {
    logoDesc: "极简博客系统",
    latest: "文章列表",
    noArticles: "暂无文章",
    statsTitle: "访问统计",
    sessions: "累计访问",
    contentViews: "文章阅读",
    publishing: "发布文章",
    uploadMd: "点击上传 .md 文件",
    restricted: "管理员模式",
    loginToContribute: "请输入用户名登录",
    return: "返回",
    author: "作者",
    impact: "影响力",
    reads: "次阅读",
    logout: "退出",
    deleteConfirm: "确定删除吗？",
    initialTitle: "欢迎使用 dailykeji",
    initialSummary: "这是一个纯净的 Markdown 博客系统，无需数据库，即开即用。",
  },
  en: {
    logoDesc: "Minimalist Blog System",
    latest: "Articles",
    noArticles: "No articles",
    statsTitle: "Statistics",
    sessions: "Total Visits",
    contentViews: "Content Views",
    publishing: "Publish",
    uploadMd: "Upload .md File",
    restricted: "Admin Access",
    loginToContribute: "Enter Username",
    return: "Back",
    author: "Author",
    impact: "Impact",
    reads: "Reads",
    logout: "Logout",
    deleteConfirm: "Delete this post?",
    initialTitle: "Welcome to dailykeji",
    initialSummary: "A clean Markdown blog system. No database, zero-config, instant publish.",
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<'zh' | 'en'>(() => {
    return (localStorage.getItem('blog_lang') as 'zh' | 'en') || 'zh';
  });

  const t = useMemo(() => translations[lang], [lang]);

  const INITIAL_POSTS: Post[] = [
    {
      id: '1',
      title: t.initialTitle,
      content: lang === 'zh' 
        ? '# 开启你的写作\n直接上传 Markdown 文件即可生成文章。所有数据保存在本地浏览器中。'
        : '# Start Writing\nUpload Markdown files to generate posts. All data stays in your local browser.',
      summary: t.initialSummary,
      tags: ['blog', 'minimal'],
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
  const hasTracked = useRef(false);

  useEffect(() => {
    localStorage.setItem('blog_lang', lang);
  }, [lang]);

  useEffect(() => {
    if (hasTracked.current) return;
    const SESSION_VISIT_KEY = 'dailykeji_v5_session_active';
    if (!sessionStorage.getItem(SESSION_VISIT_KEY)) {
      setTotalVisits(prev => {
        const next = prev + 1;
        localStorage.setItem('blog_total_visits', next.toString());
        return next;
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
    if (username) {
      setUser({ username, isLoggedIn: true });
      setLoginInput('');
    }
  };

  const handlePostClick = (post: Post) => {
    const VIEWED_KEY = 'dailykeji_v5_viewed';
    const viewed = JSON.parse(sessionStorage.getItem(VIEWED_KEY) || '[]');
    let updatedViews = post.views;

    if (!viewed.includes(post.id)) {
      setPosts(prev => prev.map(p => {
        if (p.id === post.id) {
          updatedViews = (p.views || 0) + 1;
          return { ...p, views: updatedViews };
        }
        return p;
      }));
      viewed.push(post.id);
      sessionStorage.setItem(VIEWED_KEY, JSON.stringify(viewed));
    }
    setSelectedPost({ ...post, views: updatedViews });
    window.scrollTo(0, 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const text = await file.text();
    const newPost: Post = {
      id: Date.now().toString(),
      title: file.name.replace('.md', ''),
      content: text,
      summary: text.slice(0, 100).replace(/[#*`]/g, '') + '...',
      tags: ['Markdown'],
      createdAt: new Date().toISOString(),
      author: user.username,
      views: 0
    };
    
    setPosts(prev => [newPost, ...prev]);
    if (e.target) e.target.value = '';
  };

  const deletePost = (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      setPosts(prev => prev.filter(p => p.id !== id));
      if (selectedPost?.id === id) setSelectedPost(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-black selection:text-white">
      <nav className="h-16 bg-white border-b border-gray-100 flex items-center sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 w-full flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedPost(null)}>
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-black text-sm">D</div>
            <div className="flex flex-col">
               <span className="text-sm font-black leading-none">dailykeji</span>
               <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{t.logoDesc}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 p-0.5 rounded-lg border">
              <button onClick={() => setLang('zh')} className={`px-2 py-1 text-[10px] font-bold rounded ${lang === 'zh' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>ZH</button>
              <button onClick={() => setLang('en')} className={`px-2 py-1 text-[10px] font-bold rounded ${lang === 'en' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>EN</button>
            </div>
            
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-900 uppercase">@{user.username}</span>
                <button onClick={() => setUser(null)} className="text-[10px] font-black text-red-500 uppercase hover:underline">{t.logout}</button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="" 
                  value={loginInput} 
                  onChange={e => setLoginInput(e.target.value)}
                  className="border px-2 py-1 text-[10px] rounded bg-gray-50 w-24 focus:w-32 transition-all outline-none focus:border-black"
                />
              </form>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          {selectedPost ? (
            <article className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-100 animate-in fade-in duration-300">
              <button onClick={() => setSelectedPost(null)} className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest mb-8 block">← {t.return}</button>
              <h1 className="text-3xl sm:text-5xl font-black mb-6 tracking-tighter">{selectedPost.title}</h1>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-12 flex gap-4">
                <span>BY {selectedPost.author}</span>
                <span>/</span>
                <span>{selectedPost.views} {t.reads}</span>
                <span>/</span>
                <span>{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="prose prose-sm sm:prose-base max-w-none whitespace-pre-wrap leading-relaxed">
                {selectedPost.content}
              </div>
            </article>
          ) : (
            <div className="space-y-8">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] border-b-2 border-black pb-2">{t.latest}</h2>
              {posts.length === 0 ? (
                <div className="py-20 text-center text-gray-300 text-xs font-bold uppercase tracking-widest border-2 border-dashed rounded-2xl">{t.noArticles}</div>
              ) : (
                <div className="grid gap-6">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} onClick={handlePostClick} onDelete={deletePost} isOwner={user?.username === post.author} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-black text-white p-8 rounded-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">{t.statsTitle}</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-6">
              <div>
                <p className="text-3xl font-black tracking-tighter">{totalVisits.toLocaleString()}</p>
                <p className="text-[9px] font-bold text-gray-500 uppercase">{t.sessions}</p>
              </div>
              <div>
                <p className="text-3xl font-black tracking-tighter">{posts.reduce((a,b)=>a+(b.views||0),0).toLocaleString()}</p>
                <p className="text-[9px] font-bold text-gray-500 uppercase">{t.contentViews}</p>
              </div>
            </div>
          </div>

          {user ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4">{t.publishing}</h3>
              <label className="block w-full text-center border-2 border-dashed border-gray-200 py-10 rounded-xl cursor-pointer hover:border-black transition-colors group">
                <span className="text-[10px] font-bold text-gray-400 group-hover:text-black">{t.uploadMd}</span>
                <input type="file" className="hidden" accept=".md" onChange={handleFileUpload} />
              </label>
            </div>
          ) : (
            <div className="bg-gray-100 p-6 rounded-2xl text-center border border-gray-200">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1">{t.restricted}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase">{t.loginToContribute}</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
};

export default App;
