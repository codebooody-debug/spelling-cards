import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { initializeStorage } from './services/init';
import { getSupabase } from './lib/supabase';
import './App.css';

// 懒加载页面组件
const HomePage = lazy(() => import('./pages/HomePage'));
const ConfirmPage = lazy(() => import('./pages/ConfirmPage'));
const TermPage = lazy(() => import('./pages/TermPage'));
const StudyPage = lazy(() => import('./pages/StudyPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

// 加载中组件
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-500">加载中...</p>
    </div>
  </div>
);

// 路由保护组件
function ProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          console.log('[ProtectedRoute] Supabase 未配置');
          setIsLoading(false);
          return;
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
      });
      return () => subscription.unsubscribe();
    }
  }, []);

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
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </BrowserRouter>
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
