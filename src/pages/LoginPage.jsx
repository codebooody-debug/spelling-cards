import { useEffect, useState } from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { BookOpen, Chrome, Mail } from 'lucide-react';

function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 检查是否已经登录
  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = '/';
      }
    };
    checkSession();
  }, []);

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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
    } catch (err) {
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📚</div>
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
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Chrome size={20} className="text-red-500" />
          {isLoading ? '登录中...' : '使用 Google 登录'}
        </button>

        {/* 分隔线 */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-gray-400 text-sm">或</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* 邮箱登录 */}
        <form onSubmit={handleEmailLogin}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="输入邮箱地址"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">我们会发送登录链接到你的邮箱</p>
        </form>

        {/* 说明 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-700">
            💡 登录后，你的学习记录将自动同步到云端，在任何设备上都能访问。
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
