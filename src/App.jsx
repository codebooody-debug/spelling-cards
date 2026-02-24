import { lazy, Suspense, useEffect, useState, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { initializeStorage } from './services/init';
import { getSupabase } from './lib/supabase';
import './App.css';

// Build: 2026-02-24 v2

// 懒加载包装器，处理加载失败
const lazyWithRetry = (importFn, name) => {
  return lazy(() => {
    return importFn().catch(err => {
      console.error(`[LazyLoad] 加载 ${name} 失败:`, err);
      // 如果是模块加载失败，尝试强制刷新
      if (err.message && err.message.includes('Failed to fetch dynamically imported module')) {
        console.log('[LazyLoad] 检测到模块加载失败，建议刷新页面');
      }
      throw err;
    });
  });
};

// 懒加载页面组件
const HomePage = lazyWithRetry(() => import('./pages/HomePage'), 'HomePage');
const ConfirmPage = lazyWithRetry(() => import('./pages/ConfirmPage'), 'ConfirmPage');
const TermPage = lazyWithRetry(() => import('./pages/TermPage'), 'TermPage');
const StudyPage = lazyWithRetry(() => import('./pages/StudyPage'), 'StudyPage');
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage'), 'LoginPage');
const AdminPage = lazyWithRetry(() => import('./pages/AdminPage'), 'AdminPage');

// 加载中组件
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-500">加载中...</p>
    </div>
  </div>
);

// 加载错误组件
const PageLoadError = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h1 className="text-xl font-bold text-gray-800 mb-2">加载失败</h1>
      <p className="text-gray-600 mb-6">
        应用已更新，请刷新页面获取最新版本
      </p>
      {error && (
        <div className="bg-gray-100 rounded-lg p-3 mb-6 text-left overflow-auto">
          <p className="text-xs text-red-600 font-mono">{error.message}</p>
        </div>
      )}
      <button 
        onClick={() => window.location.reload()} 
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        刷新页面
      </button>
    </div>
  </div>
);

// 带错误处理的 Suspense 包装器
class SuspenseWithError extends Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">加载失败</h1>
            <p className="text-gray-600 mb-6">
              应用已更新，请刷新页面获取最新版本
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    return <Suspense fallback={<PageLoader />}>{this.props.children}</Suspense>;
  }
}

// 路由保护组件
function ProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const location = window.location;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          console.log('[ProtectedRoute] Supabase 未配置');
          setIsLoading(false);
          return;
        }

        // 检查是否是 OAuth 回调（URL 中有 access_token）
        const hash = location.hash;
        const isOAuthCallback = hash && hash.includes('access_token');
        
        if (isOAuthCallback) {
          console.log('[ProtectedRoute] 检测到 OAuth 回调，等待处理...');
          // 给 Supabase 更多时间来处理 OAuth 回调
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // 添加超时机制
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('检查登录状态超时')), 10000);
        });

        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        
        console.log('[ProtectedRoute] Session:', session ? '已登录' : '未登录');
        setIsAuthenticated(!!session);
      } catch (err) {
        console.error('[ProtectedRoute] 检查认证失败:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // 监听登录状态变化
    const supabase = getSupabase();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log('[ProtectedRoute] Auth 状态变化:', _event, session ? '有session' : '无session');
        setIsAuthenticated(!!session);
        if (_event === 'SIGNED_IN') {
          setIsLoading(false);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [location.hash]);

  if (isLoading) return <PageLoader />;
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-red-500 mb-4">加载失败: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  // 初始化 Storage buckets
  useEffect(() => {
    initializeStorage();
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppProvider>
          <BrowserRouter>
            <SuspenseWithError>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                } />
                <Route path="/confirm" element={
                  <ProtectedRoute>
                    <ConfirmPage />
                  </ProtectedRoute>
                } />
                <Route path="/grade/:gradeId/term/:termId" element={
                  <ProtectedRoute>
                    <TermPage />
                  </ProtectedRoute>
                } />
                <Route path="/study/:contentId" element={
                  <ProtectedRoute>
                    <StudyPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </SuspenseWithError>
          </BrowserRouter>
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
