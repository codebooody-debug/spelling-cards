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

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);
    };

    checkAuth();

    // 监听登录状态变化
    const supabase = getSupabase();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  if (isLoading) return <PageLoader />;
  
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
