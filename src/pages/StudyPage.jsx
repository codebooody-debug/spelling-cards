import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import FlipCard from '../components/FlipCard';
import { ArrowLeft, BookOpen, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';

function StudyPage() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const { studyRecords } = useApp();
  
  const [flippedAll, setFlippedAll] = useState(false);
  const [ttsProvider, setTtsProvider] = useState('auto');
  const [availableProviders, setAvailableProviders] = useState({
    google: false,
    minimax: false,
    browser: true
  });
  const [isLoading, setIsLoading] = useState(true);

  const record = studyRecords.find(r => r.id === contentId);
  const spellingData = record?.content;

  // TTS 检测
  useEffect(() => {
    const checkAllTTS = async () => {
      setIsLoading(true);
      const [googleResult, minimaxResult] = await Promise.all([
        (async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const response = await fetch('http://localhost:3002/api/health', { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await response.json();
            return data.tts_configured;
          } catch (e) { return false; }
        })(),
        (async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const response = await fetch('http://localhost:3003/api/health', { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await response.json();
            return data.tts_configured;
          } catch (e) { return false; }
        })()
      ]);

      setAvailableProviders({ google: googleResult, minimax: minimaxResult, browser: true });
      setIsLoading(false);
      if (googleResult && ttsProvider === 'auto') setTtsProvider('google');
      else if (minimaxResult && ttsProvider === 'auto') setTtsProvider('minimax');
      else if (ttsProvider === 'auto') setTtsProvider('browser');
    };
    checkAllTTS();
    const interval = setInterval(checkAllTTS, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTTSSelect = (provider) => {
    if (provider === 'google' && !availableProviders.google) { alert('Google Cloud TTS 当前不可用'); return; }
    if (provider === 'minimax' && !availableProviders.minimax) { alert('MiniMax TTS 当前不可用'); return; }
    setTtsProvider(provider);
  };

  const resetAll = () => {
    setFlippedAll(true);
    setTimeout(() => setFlippedAll(false), 100);
    document.querySelectorAll('.card-container').forEach(card => card.classList.remove('flipped'));
  };

  const getTTSStatusDisplay = () => {
    if (isLoading) return { color: 'bg-gray-300', text: '检测语音服务...' };
    switch (ttsProvider) {
      case 'google': return { color: 'bg-blue-500', text: 'Google Cloud (WaveNet)' };
      case 'minimax': return { color: 'bg-green-500', text: 'MiniMax AI' };
      case 'browser': return { color: 'bg-yellow-500', text: '浏览器语音' };
      default: return { color: 'bg-gray-300', text: '检测中...' };
    }
  };

  const statusDisplay = getTTSStatusDisplay();

  if (!record || !spellingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-500">学习记录不存在</p>
          <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">返回首页</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - 白色背景与灰色页面对比 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <div className="bg-blue-500 p-2 rounded-lg"><BookOpen className="text-white" size={24} /></div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{spellingData.title}</h1>
                <p className="text-sm text-gray-500">{record.grade} · {record.term}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-600"><span className="font-medium">{spellingData.total_items}</span> 个单词</p>
              </div>
              <button onClick={resetAll} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title="重置所有卡片"><RotateCcw size={20} className="text-gray-600" /></button>
            </div>
          </div>
        </div>
      </header>

      {/* 语音选择 - 右对齐 */}
      <div className="max-w-[1400px] mx-auto px-4 pt-8 pb-2">
        <div className="flex justify-end">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleTTSSelect('google')} disabled={!availableProviders.google}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${availableProviders.google ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              {ttsProvider === 'google' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
              google
            </button>
            <button onClick={() => handleTTSSelect('minimax')} disabled={!availableProviders.minimax}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${availableProviders.minimax ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              {ttsProvider === 'minimax' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
              minimax
            </button>
            <button onClick={() => handleTTSSelect('browser')}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            >
              {ttsProvider === 'browser' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
              webvoice
            </button>
          </div>
        </div>
      </div>

      {/* Main - 宽度 1400px */}
      <main className="w-full py-4">
        <div className="max-w-[1400px] mx-auto px-4">
          {/* 卡片网格 - 响应式：大屏4个，中屏3个，小屏2个，手机1个 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {spellingData.items?.map((item) => (
              <FlipCard 
                key={item.id} 
                item={item} 
                ttsProvider={ttsProvider} 
                availableProviders={availableProviders}
                flippedAll={flippedAll}
              />
            ))}
          </div>

          {/* 底部 */}
          <footer className="mt-12 py-8">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <span className={`w-2.5 h-2.5 rounded-full ${statusDisplay.color}`}></span>
                <span className="text-sm text-gray-600">{statusDisplay.text}</span>
              </div>
            </div>
            <p className="text-center text-sm text-gray-400">{spellingData.title} · {spellingData.created_at}</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default StudyPage;
