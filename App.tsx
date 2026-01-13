
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Post, User } from './types';
import { PostCard } from './components/PostCard';
import { generatePostMetadata } from './services/geminiService';
import { getApiUrl } from './src/apiConfig';

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
    processing: "处理中...",
    deleteConfirm: "确定要永久删除这篇博客吗？该操作不可撤销。",
    edit: "编辑文章",
    save: "保存更改",
    cancel: "取消",
    titlePlaceholder: "文章标题",
    initialTitle: "你好 dailykeji 世界",
    initialSummary: "一个欢迎来到 dailykeji 博客平台的友好介绍。",
    uploadError: "上传失败，请重试。",
    saveError: "保存失败，请检查内容。",
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
    processing: "Processing...",
    deleteConfirm: "Are you sure you want to delete this post? This action cannot be undone.",
    edit: "Edit Post",
    save: "Save Changes",
    cancel: "Cancel",
    titlePlaceholder: "Post Title",
    initialTitle: "Hello dailykeji World",
    initialSummary: "A friendly introduction to the dailykeji blog platform.",
    uploadError: "Upload failed, please try again.",
    saveError: "Save failed, please check content.",
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<'zh' | 'en'>(() => {
    return (localStorage.getItem('blog_lang') as 'zh' | 'en') || 'zh';
  });

  const t = useMemo(() => translations[lang], [lang]);

  const [posts, setPosts] = useState<Post[]>([]);

  // Fetch posts from backend on component mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(getApiUrl('posts'));
        if (response.ok) {
          const fetchedPosts = await response.json();
          setPosts(fetchedPosts);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        // Fallback to initial post if API fails
        setPosts([{
          id: 'initial-1',
          title: translations[lang].initialTitle,
          content: lang === 'zh' 
            ? '# 欢迎来到 dailykeji\n这里是技术与简约碰撞的地方。'
            : '# Welcome to dailykeji\nThis is where technology meets simplicity.',
          summary: translations[lang].initialSummary,
          tags: ['welcome', 'tech', 'dailykeji'],
          createdAt: new Date().toISOString(),
          author: 'wangfei',
          views: 0
        }]);
      }
    };

    fetchPosts();
  }, [lang, translations]);

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
  const [editTitle, setEditTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const hasTracked = useRef(false);

  useEffect(() => localStorage.setItem('blog_lang', lang), [lang]);
  useEffect(() => localStorage.setItem('blog_user', JSON.stringify(user)), [user]);
  
  useEffect(() => {
    if (!hasTracked.current) {
      const KEY = 'dailykeji_v11_session';
      if (!sessionStorage.getItem(KEY)) {
        setTotalVisits(v => {
          const next = v + 1;
          localStorage.setItem('blog_total_visits', next.toString());
          return next;
        });
        sessionStorage.setItem(KEY, 'active');
      }
      hasTracked.current = true;
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt with:', loginInput.trim());
    
    if (loginInput.trim().toLowerCase() === 'wangfei') {
      try {
        // Try to authenticate with backend
        const apiConfig = getApiConfig();
        const response = await fetch(apiConfig.auth, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: loginInput.trim(),
            password: 'wangfei' // Using same password as username for simplicity
          }),
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser({ username: userData.username, isLoggedIn: true });
          setLoginInput('');
          setError(null);
          console.log('Login successful!', userData);
        } else {
          // Fallback to local login if backend auth fails
          setUser({ username: 'wangfei', isLoggedIn: true });
          setLoginInput('');
          setError(null);
          console.log('Local login successful!');
        }
      } catch (error) {
        console.error('Login error:', error);
        // Fallback to local login
        setUser({ username: 'wangfei', isLoggedIn: true });
        setLoginInput('');
        setError(null);
        console.log('Fallback login successful!');
      }
    } else {
      console.log('Login failed');
      setError('用户名不正确，请输入 wangfei');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedPost(null);
    setIsEditing(false);
  };

  const handlePostClick = async (post: Post) => {
    const VIEWED_KEY = 'dailykeji_viewed_v11';
    const viewedIds = JSON.parse(sessionStorage.getItem(VIEWED_KEY) || '[]');
    
    if (!viewedIds.includes(post.id)) {
      // Increment view count on backend
      try {
        const apiConfig = getApiConfig();
        await fetch(`${apiConfig.baseUrl}/api/posts/${post.id}/view`, {
          method: 'POST',
        });
        
        // Refresh posts to get updated view count
        const postsResponse = await fetch(apiConfig.posts);
        if (postsResponse.ok) {
          const updatedPosts = await postsResponse.json();
          const updatedPost = updatedPosts.find((p: Post) => p.id === post.id);
          setPosts(updatedPosts);
          setSelectedPost(updatedPost);
        }
        
        viewedIds.push(post.id);
        sessionStorage.setItem(VIEWED_KEY, JSON.stringify(viewedIds));
      } catch (error) {
        console.error('Failed to increment view count:', error);
        setSelectedPost(post);
      }
    } else {
      setSelectedPost(post);
    }
    setIsEditing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditStart = () => {
    if (selectedPost) {
      setEditContent(selectedPost.content);
      setEditTitle(selectedPost.title);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPost || !editTitle.trim()) return;
    setIsProcessing(true);
    try {
      const metadata = await generatePostMetadata(editContent);
      
      // Send update to backend
      const apiConfig = getApiConfig();
      const response = await fetch(`${apiConfig.baseUrl}/api/posts/${selectedPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent,
          summary: metadata.summary,
          tags: metadata.tags
        }),
      });
      
      if (response.ok) {
        // Refresh posts from backend
        const postsResponse = await fetch(apiConfig.posts);
        if (postsResponse.ok) {
          const updatedPosts = await postsResponse.json();
          const updatedPost = updatedPosts.find((p: Post) => p.id === selectedPost.id);
          setPosts(updatedPosts);
          setSelectedPost(updatedPost);
          setIsEditing(false);
          setError(null);
        }
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(t.saveError);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsProcessing(true);
    try {
      // Check if we're in production (Vercel) or development
      const isProduction = window.location.hostname !== 'localhost';
      const apiConfig = getApiConfig();
      
      let response;
      
      if (isProduction) {
        // Vercel: Send JSON with content
        const content = await file.text();
        const title = file.name.replace('.md', '').replace(/[-_]/g, ' ');
        
        response = await fetch(apiConfig.upload, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title,
            content: content,
            filename: file.name
          }),
        });
      } else {
        // Local: Send FormData with file
        const formData = new FormData();
        formData.append('file', file);
        
        response = await fetch(apiConfig.upload, {
          method: 'POST',
          body: formData,
        });
      }
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      console.log('Upload result:', result);
      
      // Refresh posts from backend after successful upload
      try {
        const postsResponse = await fetch(apiConfig.posts);
        if (postsResponse.ok) {
          const updatedPosts = await postsResponse.json();
          setPosts(updatedPosts);
        }
      } catch (error) {
        console.error('Failed to refresh posts:', error);
      }
      
      // Show success message
      alert(`✅ 文章发布成功！`);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(t.uploadError);
      alert(`❌ ${t.uploadError}`);
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const deletePost = async (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      try {
        const apiConfig = getApiConfig();
        const response = await fetch(`${apiConfig.baseUrl}/api/posts/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // Refresh posts from backend
          const postsResponse = await fetch(apiConfig.posts);
          if (postsResponse.ok) {
            const updatedPosts = await postsResponse.json();
            setPosts(updatedPosts);
          }
          
          // Clear selected post if it was deleted
          if (selectedPost?.id === id) {
            setSelectedPost(null);
            setIsEditing(false);
          }
        } else {
          throw new Error('Delete failed');
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const totalArticleViews = useMemo(() => posts.reduce((acc, p) => acc + (p.views || 0), 0), [posts]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-600 selection:text-white bg-gray-50/30 text-gray-900 font-sans antialiased">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setSelectedPost(null); setIsEditing(false); }}>
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
              <span className="text-white font-black text-xl italic">K</span>
            </div>
            <div className="flex flex-col -space-y-1">
              <h1 className="text-xl font-black tracking-tighter uppercase">daily<span className="text-blue-600">keji</span></h1>
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t.logoDesc}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button onClick={() => setLang('zh')} className={`px-2 py-1 text-[10px] font-bold rounded ${lang === 'zh' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>中文</button>
              <button onClick={() => setLang('en')} className={`px-2 py-1 text-[10px] font-bold rounded ${lang === 'en' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>ENG</button>
            </div>

            {user ? (
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-2">
                <div className="text-right leading-none">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">{user.username}</p>
                  <button onClick={handleLogout} className="text-[9px] text-gray-400 font-bold uppercase hover:text-red-500 transition-colors">{t.logout}</button>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-900 overflow-hidden ring-2 ring-blue-50">
                   <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`} alt="avatar" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <form onSubmit={handleLogin} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder={t.adminPlaceholder} 
                    value={loginInput} 
                    onChange={e => setLoginInput(e.target.value)} 
                    className="px-3 py-1.5 text-xs font-bold border-0 rounded-lg w-28 bg-gray-100 focus:ring-2 focus:ring-blue-600 transition-all outline-none" 
                  />
                  <button type="submit" className="bg-black text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </form>
                {error && <p className="text-[8px] text-red-500 font-bold text-center">{error}</p>}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          {selectedPost ? (
            <article className="bg-white rounded-3xl p-6 sm:p-12 border border-gray-100 shadow-xl shadow-gray-200/50 transition-all animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-12">
                <button onClick={() => { setSelectedPost(null); setIsEditing(false); }} className="flex items-center text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-[0.2em] transition-colors">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  {t.return}
                </button>
                {user && !isEditing && (
                  <div className="flex gap-2">
                    <button onClick={handleEditStart} className="px-5 py-2.5 bg-black text-white text-[10px] font-black uppercase rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-gray-200">{t.edit}</button>
                    <button onClick={() => deletePost(selectedPost.id)} className="px-5 py-2.5 bg-red-50 text-red-500 text-[10px] font-black uppercase rounded-xl hover:bg-red-500 hover:text-white transition-all">Delete</button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">{t.titlePlaceholder}</label>
                    <input 
                      type="text" 
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full p-5 text-3xl font-black bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Markdown</label>
                    <textarea 
                      value={editContent} 
                      onChange={e => setEditContent(e.target.value)}
                      className="w-full h-[50vh] p-8 text-sm font-mono bg-gray-50 border-0 rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none transition-all leading-relaxed resize-none"
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-4 rounded-xl">{error}</p>}
                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={handleSaveEdit}
                      disabled={isProcessing || !editTitle.trim()}
                      className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-200"
                    >
                      {isProcessing ? t.processing : t.save}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="px-10 bg-gray-100 text-gray-500 py-5 rounded-2xl font-black uppercase text-xs hover:bg-gray-200 transition-all">{t.cancel}</button>
                  </div>
                </div>
              ) : (
                <>
                  <header className="mb-12">
                    <h2 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter leading-tight mb-10">{selectedPost.title}</h2>
                    <div className="flex flex-wrap items-center gap-8 py-8 border-y border-gray-100">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${selectedPost.author}`} alt="author" className="w-8 h-8" />
                         </div>
                         <div>
                          <span className="block text-[8px] font-black text-gray-400 uppercase mb-0.5">{t.author}</span>
                          <span className="text-xs font-bold text-gray-900">@{selectedPost.author}</span>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-gray-100" />
                      <div>
                        <span className="block text-[8px] font-black text-gray-400 uppercase mb-0.5">{t.impact}</span>
                        <span className="text-xs font-bold text-blue-600">{selectedPost.views.toLocaleString()} {t.reads}</span>
                      </div>
                      <div className="w-px h-8 bg-gray-100 hidden sm:block" />
                      <div className="hidden sm:block">
                        <span className="block text-[8px] font-black text-gray-400 uppercase mb-0.5">Published</span>
                        <span className="text-xs font-bold text-gray-500">{new Date(selectedPost.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}</span>
                      </div>
                    </div>
                  </header>
                  <div className="prose prose-blue max-w-none prose-p:leading-relaxed prose-img:rounded-3xl prose-headings:font-black prose-headings:tracking-tight prose-headings:text-gray-900 prose-pre:bg-gray-900 prose-pre:text-gray-100">
                    <div dangerouslySetInnerHTML={{ __html: selectedPost.content.replace(/\n/g, '<br/>') }} />
                  </div>
                </>
              )}
            </article>
          ) : (
            <div className="space-y-12">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">{t.latest}</h2>
                <div className="flex-grow h-px bg-gray-900" />
              </div>
              
              {posts.length === 0 ? (
                <div className="py-40 text-center border-2 border-dashed rounded-[3rem] border-gray-200 bg-white text-gray-300 font-black uppercase text-xs tracking-[0.3em]">{t.noArticles}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {posts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onClick={handlePostClick} 
                      onDelete={deletePost} 
                      isOwner={!!user}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-gray-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-600/30 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500 mb-10 relative z-10">{t.statsTitle}</h3>
            <div className="space-y-12 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-5xl font-black tracking-tighter leading-none mb-3 tabular-nums italic">{totalVisits.toLocaleString()}</p>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t.sessions}</p>
                </div>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-5xl font-black tracking-tighter leading-none mb-3 tabular-nums italic">{totalArticleViews.toLocaleString()}</p>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t.contentViews}</p>
                </div>
              </div>
            </div>
          </div>

          {user ? (
            <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
              <h3 className="text-[10px] font-black uppercase text-gray-400 mb-8 tracking-[0.3em]">{t.publishing}</h3>
              <label className="w-full flex flex-col items-center py-14 bg-gray-50 border-4 border-dashed border-gray-100 rounded-[2rem] cursor-pointer hover:border-blue-600 hover:bg-blue-50/50 transition-all group relative overflow-hidden">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-4 py-2">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">{t.processing}</span>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-300 mb-4 shadow-sm group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest group-hover:text-black transition-colors">{t.uploadMd}</span>
                    <input type='file' className="hidden" accept=".md" onChange={handleFileUpload} disabled={isProcessing} />
                  </>
                )}
              </label>
              {error && <p className="mt-4 text-[9px] font-black text-red-500 text-center uppercase tracking-tighter">{error}</p>}
            </div>
          ) : (
            <div className="p-10 bg-white rounded-[2.5rem] border border-gray-100 text-center shadow-sm relative group overflow-hidden">
              <div className="absolute inset-0 bg-gray-50/50 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl mx-auto mb-6 flex items-center justify-center text-gray-300 group-hover:scale-110 group-hover:text-blue-600 transition-all">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-1">{t.restricted}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{t.loginToContribute}</p>
              </div>
            </div>
          )}
        </aside>
      </main>

      <footer className="py-24 bg-white border-t border-gray-100 mt-20">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-8">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl italic">K</span>
            </div>
            <div className="text-center">
              <span className="block text-[12px] font-black tracking-[0.4em] text-gray-900 uppercase mb-2">dailykeji &bull; simple markdown blog</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">&copy; {new Date().getFullYear()} all rights reserved</span>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
