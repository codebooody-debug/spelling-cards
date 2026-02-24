import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import FlipCard from '../components/FlipCard';
import { X, RotateCcw, Trash2, FlipHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { setTTSEngine, getTTSEngine } from '../services/tts';
import { useToast } from '../components/Toast';

const TTS_OPTIONS = [
  { key: 'google', label: 'Google' },
  { key: 'minimax', label: 'MiniMax' },
  { key: 'browser', label: 'Web Voice' }
];

function StudyPage() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const { studyRecords, isLoading, deleteStudyRecord } = useApp();
  const { success } = useToast();
  const [renderError, setRenderError] = useState(null);
  
  const [flippedAll, setFlippedAll] = useState(false);
  const [currentEngine, setCurrentEngine] = useState(() => {
    const saved = localStorage.getItem('tts-engine');
    const initial = saved || 'google';
    setTTSEngine(initial);
    if (!saved) {
      localStorage.setItem('tts-engine', 'google');
    }
    return initial;
  });

  useEffect(() => {
    console.log('[StudyPage] 当前 TTS 引擎:', currentEngine);
  }, []);

  const handleDelete = async () => {
    if (confirm('确定要删除这个听写记录吗？')) {
      await deleteStudyRecord(contentId);
      success('记录已删除');
      navigate('/');
    }
  };

  const handleEngineChange = (engine) => {
    if (engine === currentEngine) {
      console.log('[StudyPage] 重复点击相同引擎，忽略');
      return;
    }
    
    setTTSEngine(engine);
    setCurrentEngine(engine);
    localStorage.setItem('tts-engine', engine);
    
    const engineName = TTS_OPTIONS.find(opt => opt.key === engine)?.label || engine;
    success(`已切换到 ${engineName} 音源`);
    console.log(`[StudyPage] TTS 引擎切换为: ${engine}`);
  };

  console.log('[StudyPage] contentId:', contentId, 'type:', typeof contentId);
  console.log('[StudyPage] studyRecords count:', studyRecords.length);
  console.log('[StudyPage] isLoading:', isLoading);
  console.log('[StudyPage] studyRecords ids:', studyRecords.map(r => r.id));
  
  const record = studyRecords.find(r => {
    console.log('[StudyPage] comparing:', r.id, '===', contentId, '?', r.id === contentId);
    return r.id === contentId;
  });
  console.log('[StudyPage] found record:', record ? 'yes' : 'no');
  
  const spellingData = record?.content;

  const resetAll = () => {
    setFlippedAll(true);
    setTimeout(() => setFlippedAll(false), 100);
    document.querySelectorAll('.card-container').forEach(card => card.classList.remove('flipped'));
  };

  // 调试：显示所有信息
  console.log('[StudyPage] 最终检查:', {
    isLoading,
    contentId,
    recordFound: !!record,
    hasSpellingData: !!spellingData,
    itemsCount: spellingData?.items?.length
  });

  // 如果还在加载中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  // 记录不存在 - 显示详细信息帮助调试
  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-8 rounded-xl shadow max-w-md">
          <p className="text-gray-500 mb-2">学习记录不存在</p>
          <p className="text-xs text-gray-400 mb-2">ID: {contentId}</p>
          <p className="text-xs text-gray-400 mb-4">已加载记录: {studyRecords.length} 条</p>
          <p className="text-xs text-gray-400 mb-4">ID列表: {studyRecords.map(r => r.id?.substring?.(0, 8) || r.id).join(', ')}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 数据格式错误
  if (!spellingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-8 rounded-xl shadow max-w-md">
          <p className="text-gray-500 mb-2">记录数据格式错误</p>
          <p className="text-xs text-gray-400 mb-4">record.content 为空</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 no-horizontal-scroll">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 safe-area-top">
        <div className="max-w-[1400px] mx-auto px-4 py-4 safe-area-left safe-area-right">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="min-touch flex items-center justify-center text-4xl ml-4">📝</div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">{record.spelling_number || record.spellingNumber || 'Spelling'}</h1>
                <p className="text-sm text-gray-500 truncate max-w-[200px] sm:max-w-[300px]">{spellingData.subtitle || spellingData.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={resetAll} className="min-touch flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation touch-feedback" title="重置所有卡片">
                <FlipHorizontal size={20} className="text-gray-600" />
              </button>
              <button onClick={() => navigate('/')} className="min-touch flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation touch-feedback mr-4" title="关闭">
                <X size={24} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="w-full py-6">
        <div className="max-w-[1400px] mx-auto px-4">
          {/* 卡片网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
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
          <div className="mt-6 py-4 safe-area-bottom">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {TTS_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleEngineChange(option.key)}
                  className={`min-touch flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all touch-manipulation touch-feedback ${
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

          {/* 删除按钮 */}
          <div className="mt-4 flex justify-center safe-area-bottom">
            <button 
              onClick={handleDelete} 
              className="min-touch flex items-center gap-2 px-4 py-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors touch-manipulation touch-feedback"
            >
              <Trash2 size={18} />
              <span>删除此记录</span>
            </button>
          </div>

          {/* 底部 */}
          <footer className="mt-8 py-6 safe-area-bottom">
            <p className="text-center text-sm text-gray-400">{spellingData.title} · {spellingData.created_at}</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default StudyPage;
