import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { Upload, Trash2, Sparkles, ChevronDown, ChevronUp, LogOut, User } from 'lucide-react';
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

  // 获取当前用户信息
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

  // 登出
  const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  // 按年级和 Term 分组 - 使用 useMemo 优化性能
  const groupedByGrade = useMemo(() => {
    return studyRecords.reduce((grades, record) => {
      if (!grades[record.grade]) {
        grades[record.grade] = {};
      }
      if (!grades[record.grade][record.term]) {
        grades[record.grade][record.term] = {
          grade: record.grade,
          term: record.term,
          records: []
        };
      }
      grades[record.grade][record.term].records.push(record);
      return grades;
    }, {});
  }, [studyRecords]);

  // 排序年级和 Term
  const sortedGrades = useMemo(() => {
    const gradeOrder = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
    const termOrder = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];
    
    return Object.keys(groupedByGrade)
      .sort((a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b))
      .map(grade => ({
        grade,
        terms: Object.values(groupedByGrade[grade])
          .sort((a, b) => termOrder.indexOf(a.term) - termOrder.indexOf(b.term))
      }));
  }, [groupedByGrade]);

  const hasRecords = studyRecords.length > 0;

  // 展开状态
  const [expandedTerms, setExpandedTerms] = useState({});

  useEffect(() => {
    if (sortedGrades.length > 0) {
      const initialExpanded = {};
      sortedGrades.forEach(gradeGroup => {
        gradeGroup.terms.forEach(termGroup => {
          initialExpanded[`${gradeGroup.grade}-${termGroup.term}`] = true;
        });
      });
      setExpandedTerms(initialExpanded);
    }
  }, []);

  const toggleTerm = (termKey) => {
    setExpandedTerms(prev => ({ ...prev, [termKey]: !prev[termKey] }));
  };

  // 文件处理
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('请选择图片文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showError('图片大小不能超过 10MB');
      return;
    }

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      const imageData = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });

      // 调用 Gemini OCR API 识别图片
      console.log('🔄 正在识别图片内容...');
      
      const result = await extractSpelling(imageData);
      
      console.log('✅ 识别成功:', result);
      
      // 检查是否重复 - 比较识别出的单词列表
      const recognizedWords = result.words?.map(w => w.word.toLowerCase()) || [];
      
      if (recognizedWords.length > 0) {
        // 检查是否已存在相同或相似的听写记录
        const duplicateRecord = studyRecords.find(record => {
          const existingWords = record.content?.items?.map(item => item.target_word.toLowerCase()) || [];
          
          // 如果单词数量差异太大，直接不认为是重复
          if (Math.abs(existingWords.length - recognizedWords.length) > 2) {
            return false;
          }
          
          // 计算相同单词的数量
          const commonWords = recognizedWords.filter(word => existingWords.includes(word));
          
          // 如果相同单词超过 70%，认为是重复
          const similarity = commonWords.length / Math.max(recognizedWords.length, existingWords.length);
          return similarity >= 0.7;
        });
        
        if (duplicateRecord) {
          const shouldContinue = confirm(
            `⚠️ 检测到重复内容\n\n` +
            `这个听写记录看起来与 "${duplicateRecord.spellingNumber || '已有的记录'}" 相似。\n\n` +
            `是否继续添加为新记录？\n` +
            `（点击"确定"继续添加，点击"取消"查看已有记录）`
          );
          
          if (!shouldContinue) {
            // 跳转到已有记录的学习页面
            navigate(`/study/${duplicateRecord.id}`);
            setIsProcessing(false);
            return;
          }
        }
      }
      
      // 格式化数据用于确认页面
      const recognizedData = {
        grade: result.grade || 'P3',
        term: result.term || 'Term 1',
        spellingNumber: result.spellingNumber || 'Spelling(1)',
        title: result.title || 'Untitled',
        imageData: imageData,
        words: recognizedWords,
        extractedSentences: result.words?.map(w => ({
          word: w.word,
          sentence: w.sentence,
          blanked: w.sentence.replace(new RegExp(w.word, 'gi'), '________')
        })) || []
      };

      navigate('/confirm', { state: { recognizedData } });
    } catch (err) {
      console.error('❌ 识别失败:', err);
      showError('图片识别失败: ' + err.message);
      setIsProcessing(false);
    }
  };

  // 拖拽
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleFileSelect({ target: { files } });
    } else {
      showError('请上传图片文件');
    }
  }, [showError]);

  // 删除
  const handleDelete = (e, recordId) => {
    e.stopPropagation();
    if (confirm('确定要删除这个听写记录吗？')) {
      deleteStudyRecord(recordId);
      success('记录已删除');
    }
  };

  // 学习
  const handleStudy = (record) => {
    navigate(`/study/${record.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-3 rounded-xl">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">单词听写助手</h1>
                <p className="text-sm text-gray-500">
                  {hasRecords ? `已保存 ${studyRecords.length} 个听写记录` : '拍照或上传听写照片开始学习'}
                </p>
              </div>
            </div>
            
            {/* 用户信息 + 登出 */}
            <div className="flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={16} />
                  <span className="hidden sm:inline">{user.email}</span>
                </div>
              )}
              <button
                onClick={() => navigate('/admin')}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title="管理面板"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="退出登录"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main - 宽度 800px 居中 */}
      <main className="w-full py-8">
        <div className="max-w-[800px] mx-auto px-4">
          {/* 已有的听写记录 */}
          {hasRecords && (
            <div className="mb-8 space-y-8">
              {sortedGrades.map((gradeGroup) => (
                <div key={gradeGroup.grade}>
                  {/* 年级标题 - 固定分割 */}
                  <div className="sticky top-0 z-10 bg-gray-100 py-2 mb-4">
                    <h2 className="text-xl font-bold text-gray-800 border-l-4 border-blue-500 pl-3">
                      {gradeGroup.grade}
                    </h2>
                  </div>

                  {/* Term 分组 */}
                  <div className="space-y-4">
                    {gradeGroup.terms.map((termGroup) => {
                      const termKey = `${termGroup.grade}-${termGroup.term}`;
                      const isExpanded = expandedTerms[termKey] !== false;
                      const isTerm1 = termGroup.term === 'Term 1';

                      return (
                        <div 
                          key={termKey}
                          className={`rounded-xl overflow-hidden ${isTerm1 ? 'bg-white border border-blue-100 shadow-sm' : ''}`}
                        >
                          {/* Term 标题 */}
                          <button
                            onClick={() => toggleTerm(termKey)}
                            className={`w-full flex items-center justify-between text-left p-3 hover:bg-opacity-80 transition-colors ${
                              isTerm1 ? 'bg-blue-100/50 hover:bg-blue-100' : 'hover:bg-gray-50'
                            }`}
                          >
                            <h3 className="text-base font-semibold text-gray-700">{termGroup.term}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400">{termGroup.records.length} 个</span>
                              {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                            </div>
                          </button>

                          {/* Spelling 卡片 */}
                          {isExpanded && (
                            <div className={`space-y-2 p-3 ${isTerm1 ? 'bg-blue-50/30' : ''}`}>
                              {termGroup.records
                                .sort((a, b) => {
                                  const numA = parseInt(a.spellingNumber?.replace(/[^\d]/g, '') || '0');
                                  const numB = parseInt(b.spellingNumber?.replace(/[^\d]/g, '') || '0');
                                  if (isNaN(numA) && isNaN(numB)) {
                                    return (b.spellingNumber || '').localeCompare(a.spellingNumber || '');
                                  }
                                  if (isNaN(numA)) return 1;
                                  if (isNaN(numB)) return -1;
                                  return numB - numA;
                                })
                                .map((record) => (
                                  <div
                                    key={record.id}
                                    onClick={() => handleStudy(record)}
                                    className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer"
                                  >
                                    <div className="p-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 text-left">
                                          <h4 className="text-sm font-bold text-gray-800">{record.spellingNumber || record.content?.spellingNumber || 'Spelling'}</h4>
                                          {record.content?.subtitle && record.content.subtitle !== 'Untitled' && (
                                            <p className="text-xs text-gray-600 mt-1">{record.content.subtitle}</p>
                                          )}
                                          <p className="text-xs text-gray-400 mt-1">更新于: {new Date(record.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <button
                                          onClick={(e) => handleDelete(e, record.id)}
                                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 上传区域 */}
          <div
            className={`bg-white rounded-2xl shadow border overflow-hidden ${hasRecords ? 'border-gray-200' : 'border-blue-200'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-blue-500" />
                <h3 className="font-semibold text-gray-800">{hasRecords ? '继续添加' : '开始'}</h3>
              </div>

              {isProcessing ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">正在识别图片内容...</p>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Upload size={24} className="text-blue-500" />
                  </div>
                  <p className="font-medium text-gray-800">点击上传照片</p>
                  <p className="text-sm text-gray-400 mt-1">JPG、PNG，最大 10MB</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
