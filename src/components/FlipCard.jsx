import { useState, useCallback, useEffect, useRef } from 'react';
import { Volume2, HelpCircle, Loader2, ImageIcon } from 'lucide-react';
import { getCachedImage, saveImageToCache } from '../services/imageCache';
import { generateImage } from '../services/api';
import { getWordImageUrl, uploadWordImage, saveWordMedia } from '../services/storage';

function FlipCard({ item, ttsProvider, availableProviders, flippedAll, studyRecordId }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioCache, setAudioCache] = useState({});
  const [usageInfo, setUsageInfo] = useState(null);
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
          const prompt = `Create a simple, clean illustration of "${word}" based on this context: "${sentence}".

STYLE REQUIREMENTS (STRICT):
- Pure white background ONLY (#FFFFFF), no gradients, no shadows
- NO borders, NO frames, NO decorative elements
- NO text, NO letters, NO numbers, NO watermarks
- NO black backgrounds, NO dark vignettes
- Clean, minimal design with single clear subject
- Soft pastel colors (light blue, light pink, light yellow, light green)
- Flat illustration style, no 3D effects
- Centered composition with ample white space around
- Child-friendly, educational material style
- The subject should be clearly recognizable and take up 60-80% of the image

ABSOLUTELY PROHIBITED:
- Black or dark backgrounds
- Text or typography of any kind
- Borders or frames
- Multiple scattered elements
- Abstract patterns or textures
- Drop shadows or depth effects`;
          
          const data = await generateImage(prompt, 1024, 1024);
          
          if (abortController.signal.aborted) return;
          
          const imageBase64 = `data:${data.mimeType};base64,${data.imageBase64}`;
          
          // 1. 立即显示本地图片
          setWordImage(imageBase64);
          await saveImageToCache(word, imageBase64);
          console.log(`✅ 图片生成成功: ${word}`);
          
          // 2. 上传到 Supabase 云端（后台进行，不阻塞用户）
          if (studyRecordId) {
            uploadToCloud(word, imageBase64, studyRecordId, item);
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
      
      // 上传到云端的函数（后台执行）
      const uploadToCloud = async (word, imageBase64, recordId, itemData) => {
        try {
          const imageUrl = await uploadWordImage(word, imageBase64, recordId);
          if (imageUrl) {
            // 保存到 word_media 表
            await saveWordMedia({
              word: word.toLowerCase(),
              study_record_id: recordId,
              image_url: imageUrl,
              image_generated_at: new Date().toISOString(),
              meaning: itemData.meaning || '',
              word_type: itemData.word_type || 'noun',
              synonyms: itemData.synonyms || [],
              antonyms: itemData.antonyms || [],
              practice_sentences: itemData.practice_sentences || [],
              memory_tip: itemData.memory_tip || '',
              sentence: itemData.sentence || ''
            });
            console.log(`☁️ 图片已上传到云端: ${word}`);
          }
        } catch (error) {
          console.error(`云端上传失败 (${word}):`, error);
          // 上传失败不影响本地使用
        }
      };
      
      generateWordImage();
      
      return () => {
        abortController.abort();
      };
    };
    
    loadImage();
  }, [item.target_word, studyRecordId]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateGoogleAudio = useCallback(async (text) => {
    if (!availableProviders.google) return null;
    const cacheKey = `google-${text}`;
    if (audioCache[cacheKey]) return audioCache[cacheKey];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch('http://localhost:3002/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id: 'en-US-Wavenet-D', speed: 0.85 }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success && data.audio_base64) {
        const audioUrl = `data:audio/mp3;base64,${data.audio_base64}`;
        setAudioCache(prev => ({ ...prev, [cacheKey]: audioUrl }));
        if (data.extra_info) setUsageInfo(data.extra_info);
        return audioUrl;
      }
      throw new Error(data.error || 'No audio content');
    } catch (error) {
      console.log(`Google TTS 失败 (${text.substring(0, 20)}...):`, error.message);
      return null;
    }
  }, [audioCache, availableProviders.google]);

  const generateMiniMaxAudio = useCallback(async (text) => {
    if (!availableProviders.minimax) return null;
    const cacheKey = `minimax-${text}`;
    if (audioCache[cacheKey]) return audioCache[cacheKey];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch('http://localhost:3001/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id: 'male-qn-qingse', speed: 0.8 }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success && data.audio_base64) {
        const audioUrl = `data:audio/mp3;base64,${data.audio_base64}`;
        setAudioCache(prev => ({ ...prev, [cacheKey]: audioUrl }));
        if (data.extra_info) setUsageInfo(data.extra_info);
        return audioUrl;
      }
      throw new Error(data.error || 'No audio content');
    } catch (error) {
      console.log(`MiniMax TTS 失败 (${text.substring(0, 20)}...):`, error.message);
      return null;
    }
  }, [audioCache, availableProviders.minimax]);

  const playBrowserTTS = useCallback((text) => {
    if (!window.speechSynthesis) return false;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.pitch = 1;
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Google US English') || 
        v.name.includes('Samantha') ||
        v.lang === 'en-US'
      );
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      return false;
    }
  }, []);

  const playAudio = useCallback(async (e, text) => {
    e.stopPropagation();
    if (isPlaying || isLoading) return;
    setIsLoading(true);
    let audioUrl = null;
    let usedProvider = null;
    
    try {
      if (ttsProvider === 'google') {
        if (!availableProviders.google) throw new Error('Google Cloud TTS 服务不可用');
        audioUrl = await generateGoogleAudio(text);
        if (audioUrl) usedProvider = 'google';
        else throw new Error('Google Cloud TTS 生成音频失败');
      } else if (ttsProvider === 'minimax') {
        if (!availableProviders.minimax) throw new Error('MiniMax TTS 服务不可用');
        audioUrl = await generateMiniMaxAudio(text);
        if (audioUrl) usedProvider = 'minimax';
        else throw new Error('MiniMax TTS 生成音频失败');
      } else if (ttsProvider === 'browser') {
        const browserSuccess = playBrowserTTS(text);
        if (browserSuccess) {
          usedProvider = 'browser';
          setIsLoading(false);
          return;
        } else throw new Error('浏览器 TTS 不可用');
      } else if (ttsProvider === 'auto') {
        if (availableProviders.google) {
          audioUrl = await generateGoogleAudio(text);
          if (audioUrl) usedProvider = 'google';
        }
        if (!audioUrl && availableProviders.minimax) {
          audioUrl = await generateMiniMaxAudio(text);
          if (audioUrl) usedProvider = 'minimax';
        }
        if (!audioUrl) throw new Error('云端 TTS 不可用');
      }
      
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        await new Promise((resolve, reject) => {
          audio.onplay = () => {
            setIsPlaying(true);
            console.log(`✅ 使用 ${usedProvider} 播放: ${text.substring(0, 30)}...`);
          };
          audio.onended = () => {
            setIsPlaying(false);
            resolve();
          };
          audio.onerror = () => {
            setIsPlaying(false);
            reject(new Error('音频播放失败'));
          };
          audio.play().catch(reject);
        });
      }
    } catch (error) {
      console.error('TTS 错误:', error.message);
      alert(`语音播放失败: ${error.message}\n请尝试切换到其他语音源。`);
    } finally {
      setIsLoading(false);
    }
  }, [ttsProvider, availableProviders, generateGoogleAudio, generateMiniMaxAudio, playBrowserTTS, isPlaying, isLoading]);

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
        
        {/* 正面 - 重新设计布局 */}
        <div className="card-front absolute w-full h-full bg-white rounded-2xl shadow border border-gray-200 p-4 flex flex-col overflow-hidden">
          
          {/* 1. 顶部：单词信息 */}
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
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${getButtonClass(true)}`}>
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <span className="text-xs font-bold">Aa</span>}
              </button>
              <button onClick={(e) => playAudio(e, item.sentence)} disabled={isLoading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${getButtonClass(false)}`}>
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} className={isPlaying ? 'animate-pulse' : ''} />}
              </button>
            </div>
          </div>
          
          {/* 2. 图片区域 */}
          <div className="rounded-2xl w-[260px] h-[260px] mx-auto flex items-center justify-center mb-3 shrink-0 overflow-hidden bg-white">
            {isGeneratingImage ? (
              <div className="flex flex-col items-center text-gray-500">
                <Loader2 size={32} className="animate-spin mb-2" />
                <span className="text-sm">生成图片中...</span>
              </div>
            ) : wordImage ? (
              <img src={wordImage} alt={item.target_word}
                className="w-full h-full object-contain rounded-2xl"
                onError={() => setImageError('图片加载失败')} />
            ) : imageError ? (
              <div className="flex flex-col items-center text-gray-400">
                <ImageIcon size={40} className="mb-2" />
                <span className="text-sm text-center px-4">{item.target_word}</span>
              </div>
            ) : (
              <span className="text-6xl">🎨</span>
            )}
          </div>

          {/* 3. 例句区域 - 关键修复 */}
          <div className="flex-1 min-h-0 overflow-y-auto mb-2">
            <p className="text-base text-gray-700 leading-relaxed">{renderHighlightedSentence()}</p>
          </div>

          {/* 4. 底部区域：分割线 + 同义词反义词 */}
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
          
          {usageInfo && (
            <div className="mt-1 pt-1 border-t border-gray-100">
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>字符: {usageInfo.usage_characters}</span>
                <span>{(usageInfo.audio_length / 1000).toFixed(1)}s</span>
              </div>
            </div>
          )}
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
