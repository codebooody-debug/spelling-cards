import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { Upload, Trash2, Sparkles, ChevronDown, ChevronUp, LogOut, User, Settings } from 'lucide-react';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { extractSpelling } from '../services/api';
import { getSupabase } from '../lib/supabase';

export default function HomePage() {
  const navigate = useNavigate();
  const { studyRecords, deleteStudyRecord, isLoading } = useApp();
  const { success, error: showError } = useToast();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const supabase = getSupabase();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  const groupedByGrade = useMemo(() => {
    return studyRecords.reduce((grades, record) => {
      if (!grades[record.grade]) grades[record.grade] = {};
      if (!grades[record.grade][record.term]) {
        grades[record.grade][record.term] = { grade: record.grade, term: record.term, records: [] };
      }
      grades[record.grade][record.term].records.push(record);
      return grades;
    }, {});
  }, [studyRecords]);

  const sortedGrades = useMemo(() => {
    const gradeOrder = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
    const termOrder = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];
    return Object.keys(groupedByGrade)
      .sort((a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b))
      .map(grade => ({
        grade,
        terms: Object.values(groupedByGrade[grade]).sort((a, b) => termOrder.indexOf(a.term) - termOrder.indexOf(b.term))
      }));
  }, [groupedByGrade]);

  const hasRecords = studyRecords.length > 0;
  const [expandedTerms, setExpandedTerms] = useState({});

  useEffect(() => {
    if (sortedGrades.length > 0) {
      const initialExpanded = {};
      sortedGrades.forEach(g => g.terms.forEach(t => initialExpanded[`${g.grade}-${t.term}`] = true));
      setExpandedTerms(initialExpanded);
    }
  }, []);

  const toggleTerm = (termKey) => setExpandedTerms(prev => ({ ...prev, [termKey]: !prev[termKey] }));

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showError('请选择图片文件'); return; }
    if (file.size > 10 * 1024 * 1024) { showError('图片大小不能超过 10MB'); return; }

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      const imageData = await new Promise((resolve) => { reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file); });
      const result = await extractSpelling(imageData);
      const recognizedWords = result.words?.map(w => w.word.toLowerCase()) || [];
      
      if (recognizedWords.length > 0) {
        const duplicateRecord = studyRecords.find(record => {
          const existingWords = record.content?.items?.map(item => item.target_word.toLowerCase()) || [];
          if (Math.abs(existingWords.length - recognizedWords.length) > 2) return false;
          const commonWords = recognizedWords.filter(word => existingWords.includes(word));
          return commonWords.length / Math.max(recognizedWords.length, existingWords.length) >= 0.7;
        });
        
        if (duplicateRecord) {
          const shouldContinue = confirm(`⚠️ 检测到重复内容\n\n这个听写记录看起来与 "${duplicateRecord.spellingNumber || '已有的记录'}" 相似。\n\n是否继续添加为新记录？\n（点击"确定"继续添加，点击"取消"查看已有记录）`);
          if (!shouldContinue) { navigate(`/study/${duplicateRecord.id}`); setIsProcessing(false); return; }
        }
      }
      
      navigate('/confirm', { state: { recognizedData: {
        grade: result.grade || 'P3', term: result.term || 'Term 1',
        spellingNumber: result.spellingNumber || 'Spelling(1)',
        title: result.title || 'Untitled', imageData,
        words: recognizedWords,
        extractedSentences: result.words?.map(w => ({ word: w.word, sentence: w.sentence, blanked: w.sentence.replace(new RegExp(w.word, 'gi'), '________') })) || []
      }}});
    } catch (err) {
      showError('图片识别失败: ' + err.message);
      setIsProcessing(false);
    }
  };

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) handleFileSelect({ target: { files } });
    else showError('请上传图片文件');
  }, [showError]);

  const handleDelete = (e, recordId) => {
    e.stopPropagation();
    if (confirm('确定要删除这个听写记录吗？')) { deleteStudyRecord(recordId); success('记录已删除'); }
  };

  const handleStudy = (record) => navigate(`/study/${record.id}`);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">加载中...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 no-horizontal-scroll">
      <header className="bg-white border-b border-gray-200 safe-area-top">
        <div className="px-3 sm:px-4 py-3 sm:py-4 safe-area-left safe-area-right">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-3xl sm:text-5xl">📚</div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">单词听写助手</h1>
                <p className="text-xs sm:text-sm text-gray-500">{hasRecords ? `已保存 ${studyRecords.length} 个听写记录` : '拍照或上传听写照片开始学习'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {user && <div className="flex items-center gap-2 text-sm text-gray-600"><User size={16} /><span className="hidden sm:inline">{user.email}</span></div>}
              <button onClick={() => navigate('/admin')} className="min-touch flex items-center justify-center p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation touch-feedback" title="管理面板">
                <Settings size={20} />
              </button>
              <button onClick={handleLogout} className="min-touch flex items-center justify-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors touch-manipulation touch-feedback" title="退出登录"><LogOut size={20} /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full py-8">
        <div className="max-w-[800px] mx-auto px-4">
          {hasRecords ? (
            <div className="mb-8 space-y-8">
              {sortedGrades.map((gradeGroup) => (
                <div key={gradeGroup.grade}>
                  <div className="sticky top-0 z-10 bg-gray-100 py-3 mb-6">
                    <h2 className="text-xl font-bold text-gray-800">{gradeGroup.grade}</h2>
                  </div>
                  <div className="space-y-6">
                    {gradeGroup.terms.map((termGroup) => {
                      const termKey = `${termGroup.grade}-${termGroup.term}`;
                      const isExpanded = expandedTerms[termKey] !== false;
                      return (
                        <div key={termKey} className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
                          <div className="px-4 sm:px-6 py-3 sm:py-4 safe-area-left safe-area-right">
                            <button onClick={() => toggleTerm(termKey)} className="min-touch w-full flex items-center justify-between text-left py-2 sm:py-3 bg-white cursor-pointer transition-colors touch-manipulation">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-700">{termGroup.term}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400">{termGroup.records.length} 个</span>
                              {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="bg-white divide-y divide-gray-100 mt-2">
                              {termGroup.records.sort((a, b) => {
                                const numA = parseInt(a.spellingNumber?.replace(/[^\d]/g, '') || '0');
                                const numB = parseInt(b.spellingNumber?.replace(/[^\d]/g, '') || '0');
                                if (isNaN(numA) && isNaN(numB)) return (b.spellingNumber || '').localeCompare(a.spellingNumber || '');
                                if (isNaN(numA)) return 1; if (isNaN(numB)) return -1;
                                return numB - numA;
                              }).map((record) => (
                                <div key={record.id} className="flex items-center justify-between py-4 px-4 -mx-4 rounded-lg hover:bg-gray-50 group">
                                  <div onClick={() => handleStudy(record)} className="flex-1 min-w-0 cursor-pointer touch-manipulation">
                                    <h4 className="text-base font-medium text-gray-800 group-hover:text-gray-900 transition-colors truncate">
                                      {record.spelling_number || record.spellingNumber || 'Spelling'}
                                    </h4>
                                    {record.content?.subtitle && (
                                      <p className="text-gray-500 mt-0.5 text-sm truncate">{record.content.subtitle}</p>
                                    )}
                                  </div>
                                  <button 
                                    onClick={(e) => handleDelete(e, record.id)} 
                                    className="min-touch flex-shrink-0 flex items-center justify-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors touch-manipulation touch-feedback ml-2"
                                    title="删除"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-8 text-center py-12">
              <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-6xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">你还没有任何学习记录</h3>
              <p className="text-gray-500 mb-2">上传你的听写内容，开始智能学习之旅</p>
              <p className="text-sm text-gray-400">拍照或上传听写照片，AI 会自动识别并生成学习卡片</p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex items-center gap-2 mb-4"><Sparkles size={20} className="text-blue-500" /><h3 className="font-semibold text-gray-800">{hasRecords ? '继续添加' : '开始'}</h3></div>
              {isProcessing ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm sm:text-base text-gray-600">正在识别图片内容...</p>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-all cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3"><Upload size={20} className="sm:hidden text-blue-500" /><Upload size={24} className="hidden sm:block text-blue-500" /></div>
                  <p className="font-medium text-gray-800 text-sm sm:text-base">点击上传照片</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">JPG、PNG，最大 10MB</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
// 强制刷新 1771583706
