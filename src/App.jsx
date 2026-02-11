import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/HomePage';
import ConfirmPage from './pages/ConfirmPage';
import TermPage from './pages/TermPage';
import StudyPage from './pages/StudyPage';
import './App.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/confirm" element={<ConfirmPage />} />
          <Route path="/grade/:gradeId/term/:termId" element={<TermPage />} />
          <Route path="/study/:contentId" element={<StudyPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
