import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Check, Edit2, Sparkles, Loader2, School, Calendar, Hash, Type, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function ConfirmPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { createStudyRecord } = useApp();

  const { recognizedData } = location.state || {};

  const [isGenerating, setIsGenerating] = useState(false);
  const [editableData, setEditableData] = useState({
    grade: recognizedData?.grade || 'P3',
    term: recognizedData?.term || 'Term 1',
    spellingNumber: recognizedData?.spellingNumber || 'Spelling(1)',
    title: recognizedData?.title || 'Untitled'
  });
  const [isEditing, setIsEditing] = useState(false);

  // 使用 Gemini 识别的真实数据，如果没有则使用默认数据
  const extractedSentences = recognizedData?.extractedSentences?.length > 0 
    ? recognizedData.extractedSentences 
    : [
        {
          word: 'souvenir',
          sentence: 'My parents bought me a kangaroo soft toy as a souvenir during our recent trip to Australia.',
          blanked: 'My parents bought me a kangaroo soft toy as a ________ during our recent trip to Australia.'
        },
        {
          word: 'thoroughly',
          sentence: 'The students were reminded to check their work thoroughly to avoid careless mistakes.',
          blanked: 'The students were reminded to check their work ________ to avoid careless mistakes.'
        }
      ];

  if (!recognizedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-500">请先上传图片</p>
          <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">返回首页</button>
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    setIsGenerating(true);

    try {
      // 并行调用 Gemini 为每个单词生成丰富信息
      const enrichmentPromises = extractedSentences.map(async (item) => {
        try {
          let result;
          
          if (isSupabaseConfigured()) {
            // 使用 Supabase Edge Function (直接调用)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
            
            const edgeResponse = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-word`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  word: item.word,
                  sentence: item.sentence,
                  grade: editableData.grade
                }),
                signal: controller.signal
              }
            );
            clearTimeout(timeoutId);
            
            if (!edgeResponse.ok) {
              const errorText = await edgeResponse.text();
              throw new Error(`Edge Function error: ${errorText}`);
            }
            result = await edgeResponse.json();
          } else {
            // 本地开发模式
            const response = await fetch('http://localhost:3003/api/enrich-word', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                word: item.word,
                sentence: item.sentence,
                grade: editableData.grade
              })
            });
            result = await response.json();
          }
          
          if (result.success) {
            return result.data;
          }
          throw new Error(result.error);
        } catch (error) {
          console.error(`丰富单词 ${item.word} 失败:`, error);
          // 失败时返回默认数据
          return {
            meaning: '',
            wordType: 'noun',
            synonyms: [],
            antonyms: [],
            practiceSentences: [],
            memoryTip: ''
          };
        }
      });
      
      // 等待所有单词信息生成完成
      const enrichedWords = await Promise.all(enrichmentPromises);
      
      // 组合数据
      const items = extractedSentences.map((item, index) => ({
        id: index + 1,
        target_word: item.word,
        sentence: item.sentence,
        blanked_sentence: item.blanked,
        phonetic: '/fəˈnetɪk/',
        ...enrichedWords[index]
      }));

      const newRecord = await createStudyRecord({
        grade: editableData.grade,
        term: editableData.term,
        subject: 'Spelling',
        title: `${editableData.grade} ${editableData.term} ${editableData.spellingNumber}`,
        spellingNumber: editableData.spellingNumber,
        sourceImage: recognizedData.imageData,
        content: {
          title: editableData.spellingNumber,
          subtitle: editableData.title,
          created_at: new Date().toISOString().split('T')[0],
          total_items: items.length,
          items
        }
      });

      navigate(`/study/${newRecord.id}`);
    } catch (error) {
      console.error('生成失败:', error);
      alert('生成学习卡片失败，请重试');
      setIsGenerating(false);
    }
  };

  const handleChange = (field, value) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
  };

  const renderHighlightedSentence = (sentence, word) => {
    const parts = sentence.split(word);
    return parts.map((part, index, arr) => (
      <span key={index}>
        {part}
        {index < arr.length - 1 && (
          <span className="bg-yellow-200 px-1 rounded font-semibold text-gray-900 border-b-2 border-yellow-400">{word}</span>
        )}
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[800px] mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                <Sparkles className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">确认识别结果</h1>
                <p className="text-sm text-gray-500">检查AI识别的年级和听写内容</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full py-8">
        <div className="max-w-[800px] mx-auto px-4">
          {/* 识别的基本信息 */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles size={20} />
                  <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">AI 识别完成</span>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Edit2 size={14} />{isEditing ? '完成编辑' : '编辑'}
                </button>
              </div>
            </div>

            <div className="p-6">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                    <select
                      value={editableData.grade}
                      onChange={(e) => handleChange('grade', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {['P1', 'P2', 'P3', 'P4', 'P5', 'P6'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">学期</label>
                    <select
                      value={editableData.term}
                      onChange={(e) => handleChange('term', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {['Term 1', 'Term 2', 'Term 3', 'Term 4'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">听写编号</label>
                    <input
                      type="text"
                      value={editableData.spellingNumber}
                      onChange={(e) => handleChange('spellingNumber', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="例如: Spelling(2)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">标题/单元</label>
                    <input
                      type="text"
                      value={editableData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="例如: Unit 1 - Fearless phil"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><School size={20} className="text-blue-600" /></div>
                    <div><p className="text-xs text-gray-500">年级</p><p className="text-lg font-semibold text-gray-800">{editableData.grade}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Calendar size={20} className="text-green-600" /></div>
                    <div><p className="text-xs text-gray-500">学期</p><p className="text-lg font-semibold text-gray-800">{editableData.term}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Hash size={20} className="text-purple-600" /></div>
                    <div><p className="text-xs text-gray-500">听写编号</p><p className="text-lg font-semibold text-gray-800">{editableData.spellingNumber}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><Type size={20} className="text-orange-600" /></div>
                    <div><p className="text-xs text-gray-500">单词数量</p><p className="text-lg font-semibold text-gray-800">{extractedSentences.length} 个</p></div>
                  </div>
                </div>
              )}

              {!isEditing && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2"><BookOpen size={16} className="text-gray-400" /><span className="text-sm text-gray-500">标题/单元</span></div>
                  <p className="text-lg font-medium text-gray-800 mt-1">{editableData.title}</p>
                </div>
              )}
            </div>
          </div>

          {/* 提取的句子列表 */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden mt-6">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Type size={18} className="text-blue-500" />提取的听写句子
                <span className="text-sm font-normal text-gray-500">（{extractedSentences.length} 个）</span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">黄色高亮部分为需要填写的单词</p>
            </div>

            <div className="divide-y divide-gray-100">
              {extractedSentences.map((item, index) => (
                <div key={index} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">{index + 1}</span>
                    <div className="flex-1">
                      <p className="text-base text-gray-800 leading-relaxed">{renderHighlightedSentence(item.sentence, item.word)}</p>
                      <p className="text-sm text-gray-400 mt-1">目标单词: <span className="font-medium text-blue-600">{item.word}</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4">
            <button onClick={() => navigate('/')} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">重新上传</button>
            <button
              onClick={handleConfirm}
              disabled={isGenerating}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
            >
              {isGenerating ? (
                <><Loader2 size={18} className="animate-spin" />AI生成单词信息中...</>
              ) : (
                <><Check size={18} />确认并生成卡片</>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
