import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// 懒加载页面组件
const HomePage = lazy(() => import('./pages/HomePage'));
const ConfirmPage = lazy(() => import('./pages/ConfirmPage'));
const TermPage = lazy(() => import('./pages/TermPage'));
const StudyPage = lazy(() => import('./pages/StudyPage'));

// 加载中组件
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-500">加载中...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/confirm" element={<ConfirmPage />} />
              <Route path="/grade/:gradeId/term/:termId" element={<TermPage />} />
              <Route path="/study/:contentId" element={<StudyPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
