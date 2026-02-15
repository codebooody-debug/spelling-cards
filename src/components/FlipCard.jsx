import { useState, useCallback, useEffect, useRef } from 'react';
import { Volume2, HelpCircle, Loader2, ImageIcon } from 'lucide-react';
import { getCachedImage, saveImageToCache } from '../services/imageCache';
import { generateImage } from '../services/api';
import { getWordImageUrl, uploadWordImage, saveWordMedia } from '../services/storage';

function FlipCard({ item, flippedAll, studyRecordId }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wordImage, setWordImage] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState(null);
  
  const hasGeneratedRef = useRef(false);

  // 监听 flippedAll 变化，重置卡片状态
  useEffect(() => {
    if (flippedAll) {
      setIsFlipped(false);
    }
  }, [flippedAll]);

  // 加载或生成图片
  useEffect(() => {
    const loadImage = async () => {
      const word = item.target_word;
      
      // 步骤1: 优先从 Supabase 云端加载
      if (studyRecordId) {
        try {
          const cloudUrl = await getWordImageUrl(word, studyRecordId);
          if (cloudUrl) {
            setWordImage(cloudUrl);
            // 同时缓存到本地 IndexedDB
            await saveImageToCache(word, cloudUrl);
            console.log(`☁️ 从云端加载图片: ${word}`);
            return;
          }
        } catch (error) {
          console.log(`云端加载失败 (${word}), 尝试本地缓存:`, error);
        }
      }
      
      // 步骤2: 从本地 IndexedDB 加载
      const cachedImage = await getCachedImage(word);
      if (cachedImage) {
        setWordImage(cachedImage);
        hasGeneratedRef.current = true;
        return;
      }
      
      // 步骤3: 如果没有缓存，生成新图片
      if (hasGeneratedRef.current || isGeneratingImage) return;
      
      hasGeneratedRef.current = true;
      setIsGeneratingImage(true);
      setImageError(null);
      
      const abortController = new AbortController();
      
      const generateWordImage = async () => {
        try {
          const sentence = item.sentence || '';
          const prompt = `Create a clean, minimalist illustration of "${word}" for educational flashcards.

STRICT STYLE GUIDELINES (MUST FOLLOW):
- Background: Pure white (#FFFFFF) only, no gradients, no shadows, no vignettes
- Style: Flat 2D vector illustration, no 3D effects, no photorealism
- Colors: Limited pastel palette - soft blue (#B8D4E3), soft pink (#F4C2C2), soft yellow (#F9E4B7), soft green (#C1E1C1), soft purple (#D4C4E0)
- Composition: Single centered subject, taking up exactly 65-75% of the image area
- Subject: Simple, iconic representation of "${word}", immediately recognizable
- Borders: Absolutely NO borders, frames, or decorative edges
- Text: Absolutely NO text, letters, numbers, or watermarks
- Shadows: NO drop shadows, no depth effects, no gradients
- Complexity: Minimal details, clean lines, geometric shapes preferred
- Mood: Friendly, educational, suitable for children aged 6-12
- Consistency: Match the style of children's educational book illustrations

TECHNICAL SPECIFICATIONS:
- Aspect ratio: Perfect square (1:1)
- Resolution: 1024x1024 pixels
- Format: PNG with transparent or pure white background
- Centering: Subject perfectly centered both horizontally and vertically

CONTEXT: "${sentence}"

Generate a consistent, professional educational illustration.`;
          
          const data = await generateImage(prompt, 1024, 1024);
          
          if (abortController.signal.aborted) return;
          
          const imageBase64 = `data:${data.mimeType};base64,${data.imageBase64}`;
          
          // 1. 立即显示本地图片
          setWordImage(imageBase64);
          await saveImageToCache(word, imageBase64);
          console.log(`✅ 图片生成成功: ${word}`);
          
          // 2. 上传到云端并保存到数据库
          if (studyRecordId) {
            console.log(`☁️ 上传图片到 Storage: ${word}`);
            const imageUrl = await uploadWordImage(word, imageBase64, studyRecordId);
            
            if (imageUrl) {
              console.log(`☁️ 图片上传成功，保存到数据库: ${word}`);
              
              // 保存到 word_media 表
              const mediaData = {
                word: word,
                studyRecordId: studyRecordId,
                imageUrl: imageUrl,
                meaning: item.meaning || '',
                wordType: item.word_type || 'noun',
                phonetic: item.phonetic || '/fəˈnetɪk/',
                synonyms: item.synonyms || [],
                antonyms: item.antonyms || [],
                practiceSentences: item.practice_sentences || item.practiceSentences || [],
                memoryTip: item.memory_tip || item.memoryTip || '',
                sentence: item.sentence || ''
              };
              
              const savedMedia = await saveWordMedia(mediaData);
              if (savedMedia) {
                console.log(`✅ 数据库记录创建成功: ${word}`);
              } else {
                console.error(`❌ 数据库记录创建失败: ${word}`);
              }
            } else {
              console.error(`❌ 图片上传失败: ${word}`);
            }
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log(`🚫 图片生成请求已取消: ${word}`);
            return;
          }
          console.error(`❌ 图片生成失败 (${word}):`, error.message);
          setImageError(error.message);
          hasGeneratedRef.current = false;
        } finally {
          setIsGeneratingImage(false);
        }
      };
      
      generateWordImage();
      
      return () => {
        abortController.abort();
      };
    };
    
    loadImage();
  }, [item.target_word, studyRecordId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 浏览器原生语音合成
  const playBrowserTTS = useCallback((text) => {
    if (!window.speechSynthesis) {
      console.warn('浏览器不支持语音合成');
      return false;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.pitch = 1;
      
      // 尝试选择更好的语音
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Google US English') || 
        v.name.includes('Samantha') ||
        v.lang === 'en-US'
      );
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = (e) => {
        console.error('TTS 错误:', e);
        setIsPlaying(false);
      };
      
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (error) {
      console.error('浏览器 TTS 失败:', error);
      return false;
    }
  }, []);

  // 播放语音
  const playAudio = useCallback(async (e, text) => {
    e.stopPropagation();
    if (isPlaying || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const success = playBrowserTTS(text);
      if (!success) {
        throw new Error('浏览器语音合成不可用');
      }
    } catch (error) {
      console.error('播放失败:', error.message);
      // 静默失败，不弹 alert 打扰用户
    } finally {
      setIsLoading(false);
    }
  }, [playBrowserTTS, isPlaying, isLoading]);

  const handleFlip = () => setIsFlipped(!isFlipped);

  const renderHighlightedSentence = () => {
    const parts = item.sentence.split(item.target_word);
    return parts.map((part, index) => (
      <span key={index}>
        {part}
        {index < parts.length - 1 && (
          <span className="highlight-word px-1 rounded font-bold text-blue-700">{item.target_word}</span>
        )}
      </span>
    ));
  };

  const getButtonClass = (isWord) => {
    if (isLoading) return 'bg-gray-100 text-gray-400';
    if (isPlaying) return isWord ? 'bg-green-500 text-white' : 'bg-blue-500 text-white';
    return isWord ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100';
  };

  return (
    <div 
      className={`card-container min-h-[550px] h-auto max-h-[800px] cursor-pointer ${isFlipped ? 'flipped' : ''}`}
      onClick={handleFlip}
    >
      <div className="card-inner relative w-full h-full">
        
        {/* 正面 */}
        <div className="card-front absolute w-full h-full bg-white rounded-2xl shadow border border-gray-200 p-4 flex flex-col overflow-hidden">
          
          {/* 顶部：单词信息 */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900">{item.target_word}</span>
                <span className="text-sm text-gray-500">{item.phonetic}</span>
              </div>
              {item.meaning && (
                <div className="mt-0.5">
                  <span className="text-sm text-gray-600">{item.meaning}</span>
                  <span className="text-xs text-gray-400 ml-1">· {item.word_type}</span>
                </div>
              )}
            </div>
            <div className="flex gap-1.5">
              <button onClick={(e) => playAudio(e, item.target_word)} disabled={isLoading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${getButtonClass(true)}`}
                title="播放单词">
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <span className="text-xs font-bold">Aa</span>}
              </button>
              <button onClick={(e) => playAudio(e, item.sentence)} disabled={isLoading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${getButtonClass(false)}`}
                title="播放例句">
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} className={isPlaying ? 'animate-pulse' : ''} />}
              </button>
            </div>
          </div>
          
          {/* 图片区域 - 统一尺寸和样式 */}
          <div className="rounded-2xl w-[260px] h-[260px] mx-auto flex items-center justify-center mb-3 shrink-0 overflow-hidden bg-white border-2 border-gray-100">
            {isGeneratingImage ? (
              <div className="flex flex-col items-center text-gray-500">
                <Loader2 size={32} className="animate-spin mb-2" />
                <span className="text-sm">生成图片中...</span>
              </div>
            ) : wordImage ? (
              <img 
                src={wordImage} 
                alt={item.target_word}
                className="w-full h-full object-cover rounded-xl"
                style={{ 
                  aspectRatio: '1/1',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
                onError={() => setImageError('图片加载失败')} 
              />
            ) : imageError ? (
              <div className="flex flex-col items-center text-gray-400">
                <ImageIcon size={40} className="mb-2" />
                <span className="text-sm text-center px-4">{item.target_word}</span>
              </div>
            ) : (
              <span className="text-6xl">🎨</span>
            )}
          </div>

          {/* 例句区域 */}
          <div className="flex-1 min-h-0 overflow-y-auto mb-2">
            <p className="text-base text-gray-700 leading-relaxed">{renderHighlightedSentence()}</p>
          </div>

          {/* 底部：同义词反义词 */}
          <div className="pt-2 border-t border-gray-100">
            {item.synonyms?.length > 0 && (
              <div className="mb-1 flex items-center flex-wrap gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500/50 shrink-0" title="同义词"></span>
                <span className="text-sm text-gray-700 font-medium">{item.synonyms.join(' · ')}</span>
              </div>
            )}
            {item.antonyms?.length > 0 && (
              <div className="flex items-center flex-wrap gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/50 shrink-0" title="反义词"></span>
                <span className="text-sm text-gray-700 font-medium">{item.antonyms.join(' · ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* 背面 */}
        <div className="card-back absolute w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow border border-blue-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">更多例句</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {item.practiceSentences?.length > 0 ? (
              <div className="space-y-3">
                {item.practiceSentences.slice(0, 3).map((sentence, index) => (
                  <div key={index} className="p-3 bg-white/70 rounded-lg">
                    <p className="text-base text-gray-800 leading-relaxed">
                      {sentence.replace(/________/g, item.target_word)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-white/50 rounded-lg text-center">
                <p className="text-sm text-gray-500">暂无额外例句</p>
              </div>
            )}
            {item.memory_tip && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800 flex items-start gap-1.5">
                  <HelpCircle size={14} className="shrink-0 mt-0.5 text-yellow-600" />
                  <span>{item.memory_tip}</span>
                </p>
              </div>
            )}
          </div>
          <div className="mt-auto pt-3 border-t border-blue-200/50">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500/60 mt-1.5 shrink-0" title="原句"></span>
              <p className="text-sm text-gray-700 leading-relaxed">{item.sentence}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlipCard;
