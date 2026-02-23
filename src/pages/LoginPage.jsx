import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { BookOpen, Chrome, Mail } from 'lucide-react';

function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 检查是否已经登录 + 处理 OAuth 回调
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          console.log('[LoginPage] Supabase 未配置');
          return;
        }
        
        // 首先检查 URL 中是否有 OAuth 回调参数
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          console.log('[LoginPage] 检测到 OAuth 回调，处理中...');
          // Supabase 会自动处理 hash 中的 token，我们只需要等待一下
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[LoginPage] 获取 session 失败:', error);
          setError('获取登录状态失败: ' + error.message);
          return;
        }
        
        if (session) {
          console.log('[LoginPage] 已有 session，跳转到首页');
          navigate('/');
        } else {
          console.log('[LoginPage] 未登录，显示登录界面');
        }
      } catch (err) {
        console.error('[LoginPage] 检查 session 失败:', err);
        setError('检查登录状态失败: ' + err.message);
      }
    };
    
    checkSession();
    
    // 监听 auth 状态变化
    const supabase = getSupabase();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('[LoginPage] Auth 状态变化:', event, session ? '有session' : '无session');
        if (event === 'SIGNED_IN' && session) {
          navigate('/');
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [navigate]);

  // Google 登录
  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase 未配置，无法登录');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      
      // signInWithOAuth 成功后返回 provider 的 URL，需要手动跳转
      if (data?.url) {
        console.log('[LoginPage] 跳转到 Google OAuth:', data.url);
        window.location.href = data.url;
      } else {
        console.log('[LoginPage] 等待 OAuth 重定向...');
      }
    } catch (err) {
      console.error('[LoginPage] Google 登录失败:', err);
      setError(err.message || '登录失败');
      setIsLoading(false);
    }
  };

  // 邮箱登录（备用）
  const [email, setEmail] = useState('');
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError('');

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;
      alert('请检查邮箱，点击链接完成登录');
    } catch (err) {
      setError(err.message || '发送邮件失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8 sm:p-4 safe-area-top safe-area-bottom safe-area-left safe-area-right no-horizontal-scroll">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8 px-2">
          <img src="/login-banner.jpg" alt="单词听写助手" className="w-full max-w-[280px] sm:max-w-full mx-auto mb-4 rounded-2xl" />
          <h1 className="text-2xl font-bold text-gray-800">单词听写助手</h1>
          <p className="text-gray-500 mt-2">登录以同步你的学习记录</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Google 登录 */}
        <div className="px-1">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="min-touch w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation touch-feedback"
          >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isLoading ? '登录中...' : '使用 Google 登录'}
        </button>
        </div>

        {/* 分隔线 */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-gray-400 text-sm">或</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* 邮箱登录 */}
        <form onSubmit={handleEmailLogin} className="w-full px-1">
          <div className="flex gap-2 items-center">
            <div className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${email ? 'w-[calc(100%-84px)]' : 'w-full'}`}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="输入邮箱地址"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${email ? 'w-[84px] opacity-100' : 'w-0 opacity-0'}`}>
              <button
                type="submit"
                disabled={isLoading}
                className="min-touch w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-0 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap touch-manipulation touch-feedback"
              >
                发送
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">我们会发送登录链接到你的邮箱</p>
        </form>

        {/* 说明 */}
        <div className="mt-6 sm:mt-8 p-4 bg-blue-50 rounded-xl mx-1">
          <p className="text-sm text-blue-700">
            💡 登录后，你的学习记录将自动同步到云端，在任何设备上都能访问。
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
