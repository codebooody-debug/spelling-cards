import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import FlipCard from '../components/FlipCard';
import { ArrowLeft, BookOpen, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { setTTSEngine, getTTSEngine } from '../services/tts';

const TTS_OPTIONS = [
  { key: 'google', label: 'Google' },
  { key: 'minimax', label: 'MiniMax' },
  { key: 'browser', label: 'Web Voice' }
];

function StudyPage() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const { studyRecords } = useApp();
  
  const [flippedAll, setFlippedAll] = useState(false);
  const [currentEngine, setCurrentEngine] = useState(getTTSEngine());

  // 从 localStorage 恢复 TTS 设置
  useEffect(() => {
    const saved = localStorage.getItem('tts-engine');
    if (saved) {
      setTTSEngine(saved);
      setCurrentEngine(saved);
    }
  }, []);

  const handleEngineChange = (engine) => {
    setTTSEngine(engine);
    setCurrentEngine(engine);
    localStorage.setItem('tts-engine', engine);
  };

  console.log('[StudyPage] contentId:', contentId);
  console.log('[StudyPage] studyRecords count:', studyRecords.length);
  
  const record = studyRecords.find(r => r.id === contentId);
  console.log('[StudyPage] found record:', record ? 'yes' : 'no');
  
  const spellingData = record?.content;

  const resetAll = () => {
    setFlippedAll(true);
    setTimeout(() => setFlippedAll(false), 100);
    document.querySelectorAll('.card-container').forEach(card => card.classList.remove('flipped'));
  };

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
      {/* Header */}
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
              <button onClick={resetAll} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title="重置所有卡片">
                <RotateCcw size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="w-full py-6">
        <div className="max-w-[1400px] mx-auto px-4">
          {/* 卡片网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {spellingData.items?.map((item) => (
              <FlipCard 
                key={item.id} 
                item={item} 
                flippedAll={flippedAll}
                studyRecordId={contentId}
              />
            ))}
          </div>

          {/* TTS 音频来源切换栏 */}
          <div className="mt-8 py-4 bg-white rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-center gap-6">
              <span className="text-sm text-gray-500">音频来源:</span>
              <div className="flex items-center gap-4">
                {TTS_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleEngineChange(option.key)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                      currentEngine === option.key
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      currentEngine === option.key ? 'bg-blue-500' : 'bg-gray-300'
                    }`}></span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 底部 */}
          <footer className="mt-12 py-8">
            <p className="text-center text-sm text-gray-400">{spellingData.title} · {spellingData.created_at}</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default StudyPage;
