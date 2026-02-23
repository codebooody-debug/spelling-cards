import { useState, useCallback, useEffect, useRef } from 'react';
import { Volume2, HelpCircle, Loader2, ImageIcon } from 'lucide-react';
import { getCachedImage, saveImageToCache } from '../services/imageCache';
import { generateImage } from '../services/api';
import { getWordImageUrl, uploadWordImage, saveWordMedia } from '../services/storage';
import { playTTS, getTTSEngine } from '../services/tts';

function FlipCard({ item, flippedAll, studyRecordId }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wordImage, setWordImage] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState(null);
  const hasGeneratedRef = useRef(false);

  useEffect(() => { if (flippedAll) setIsFlipped(false); }, [flippedAll]);

  useEffect(() => {
    const loadImage = async () => {
      const word = item.target_word;
      
      // 1. 先尝试从 sessionStorage 同步恢复（最快，切换页面时不闪烁）
      try {
        const sessionCached = sessionStorage.getItem(`img_${word}`);
        if (sessionCached) {
          setWordImage(sessionCached);
          hasGeneratedRef.current = true;
        }
      } catch (e) {}
      
      // 2. 检查云端存储
      if (studyRecordId) {
        try {
          const cloudUrl = await getWordImageUrl(word, studyRecordId);
          if (cloudUrl) { 
            setWordImage(cloudUrl); 
            await saveImageToCache(word, cloudUrl);
            try { sessionStorage.setItem(`img_${word}`, cloudUrl); } catch (e) {}
            hasGeneratedRef.current = true;
            return; 
          }
        } catch (e) {}
      }
      
      // 3. 检查 IndexedDB 缓存
      const cached = await getCachedImage(word);
      if (cached) { 
        setWordImage(cached); 
        hasGeneratedRef.current = true;
        // 同步到 sessionStorage 供下次快速恢复
        try { sessionStorage.setItem(`img_${word}`, cached); } catch (e) {}
        return; 
      }
      
      // 4. 需要生成新图片
      if (hasGeneratedRef.current || isGeneratingImage) return;
      
      hasGeneratedRef.current = true;
      setIsGeneratingImage(true);
      try {
        // 构建图片生成 prompt - 优化版
        const sentence = item.sentence || '';
        const meaning = item.meaning || '';
        
        const prompt = `Create a vibrant, detailed illustration for the word "${word}" (${meaning}) in the context: "${sentence}".

CRITICAL REQUIREMENTS:
- NO square blocks, NO rectangular color patches in background
- NO geometric shapes as background elements
- Background should be organic, gradient, or environmental (sky, nature, room, etc.)

STYLE GUIDE:
- Blend 2D illustration with subtle 3D elements for depth
- Rich color palette: 4-6 harmonious colors, vibrant but cohesive
- Consistent warm and friendly art style across all images
- Soft gradients or natural environments for backgrounds only

COMPOSITION:
- Center the main subject clearly
- Add environmental context from the sentence
- Include small storytelling details that explain the word's meaning
- Depth through layering: foreground, middle ground, soft background

QUALITY:
- Clean, crisp lines
- No harsh edges or borders
- NO text or letters in the image
- Suitable for children's educational materials
- Make the word's meaning immediately obvious from the visual`;
        
        const data = await generateImage(prompt, 1024, 1024);
        const imageBase64 = `data:${data.mimeType};base64,${data.imageBase64}`;
        setWordImage(imageBase64);
        await saveImageToCache(word, imageBase64);
        try { sessionStorage.setItem(`img_${word}`, imageBase64); } catch (e) {}
        if (studyRecordId) {
          const imageUrl = await uploadWordImage(word, imageBase64, studyRecordId);
          if (imageUrl) await saveWordMedia({ word, studyRecordId, imageUrl });
        }
      } catch (e) { setImageError(e.message); hasGeneratedRef.current = false; }
      finally { setIsGeneratingImage(false); }
    };
    loadImage();
  }, [item.target_word, studyRecordId]);

  const playAudio = useCallback(async (e, text) => {
    e.stopPropagation();
    if (isPlaying || isLoading) return;
    setIsLoading(true); 
    setIsPlaying(true);
    try { 
      await playTTS(text, { rate: 0.9, lang: 'en-US' }); 
    } catch (error) {
      console.error('[FlipCard] TTS播放失败:', error);
      // 显示详细错误提示
      const engine = getTTSEngine();
      let errorMsg = error.message || '未知错误';
      
      // 提取详细错误信息
      if (errorMsg.includes('non-2xx')) {
        errorMsg = 'Edge Function 调用失败，可能是 API Key 未配置或服务异常';
      }
      
      alert(`语音播放失败\n\n当前音源: ${engine}\n错误: ${errorMsg}\n\n建议:\n1. 检查网络连接\n2. 切换到 Web Voice 音源\n3. 联系管理员检查 API 配置`);
    } finally { 
      setIsLoading(false); 
      setIsPlaying(false); 
    }
  }, [isPlaying, isLoading]);

  const handleFlip = useCallback(() => {
    console.log('[FlipCard] 翻转卡片, 当前状态:', isFlipped);
    setIsFlipped(prev => !prev);
  }, [isFlipped]);

  const renderHighlightedSentence = () => {
    const parts = item.sentence.split(item.target_word);
    return parts.map((part, i) => (
      <span key={i}>{part}{i < parts.length - 1 && <span className="highlight-word px-1 rounded font-bold text-blue-700">{item.target_word}</span>}</span>
    ));
  };

  const getButtonClass = (isWord) => {
    if (isLoading) return 'bg-gray-100 text-gray-400';
    if (isPlaying) return isWord ? 'bg-green-500 text-white' : 'bg-blue-500 text-white';
    return isWord ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100';
  };

  return (
    <div className={`card-container min-h-[550px] h-auto max-h-[800px] cursor-pointer ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
      <div className="card-inner relative w-full h-full">
        <div className="card-front absolute w-full h-full bg-white rounded-2xl shadow border border-gray-200 p-4 flex flex-col overflow-hidden">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900">{item.target_word}</span>
                <span className="text-sm text-gray-500">{item.phonetic}</span>
              </div>
              {item.meaning && <div className="mt-0.5"><span className="text-sm text-gray-600">{item.meaning}</span><span className="text-xs text-gray-400 ml-1">· {item.word_type}</span></div>}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={(e) => playAudio(e, item.target_word)} disabled={isLoading} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${getButtonClass(true)}`} title="播放单词">
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <span className="text-xs font-bold">Aa</span>}
              </button>
              <button onClick={(e) => playAudio(e, item.sentence)} disabled={isLoading} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${getButtonClass(false)}`} title="播放例句">
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} className={isPlaying ? 'animate-pulse' : ''} />}
              </button>
            </div>
          </div>
          <div className="rounded-2xl w-[260px] h-[260px] mx-auto flex items-center justify-center mb-3 shrink-0 overflow-hidden bg-white">
            {isGeneratingImage ? <div className="flex flex-col items-center text-gray-500"><Loader2 size={32} className="animate-spin mb-2" /><span className="text-sm">生成图片中...</span></div> :
             wordImage ? <img src={wordImage} alt={item.target_word} className="w-full h-full object-cover rounded-xl" onError={() => setImageError('图片加载失败')} /> :
             imageError ? <div className="flex flex-col items-center text-gray-400"><ImageIcon size={40} className="mb-2" /><span className="text-sm text-center px-4">{item.target_word}</span></div> :
             <span className="text-6xl">🎨</span>}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto mb-2"><p className="text-base text-gray-700 leading-relaxed">{renderHighlightedSentence()}</p></div>
          <div className="pt-2 border-t border-gray-100">
            {item.synonyms?.length > 0 && <div className="mb-1 flex items-center flex-wrap gap-2"><span className="w-3 h-3 rounded-full bg-blue-500/50 shrink-0" title="同义词"></span><span className="text-sm text-gray-700 font-medium">{item.synonyms.join(' · ')}</span></div>}
            {item.antonyms?.length > 0 && <div className="flex items-center flex-wrap gap-2"><span className="w-3 h-3 rounded-full bg-red-500/50 shrink-0" title="反义词"></span><span className="text-sm text-gray-700 font-medium">{item.antonyms.join(' · ')}</span></div>}
          </div>
        </div>
        <div className="card-back absolute w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow border border-blue-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3"><span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">更多例句</span></div>
          <div className="flex-1 overflow-y-auto">
            {item.practiceSentences?.length > 0 ? <div className="space-y-4">{item.practiceSentences.slice(0, 3).map((s, i) => <div key={i} className="flex flex-col gap-2">
              <button onClick={(e) => playAudio(e, s.replace(/________/g, item.target_word))} className="self-end p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors" title="播放">
                <Volume2 size={16} />
              </button>
              <div className="p-3 bg-white/70 rounded-lg"><p className="text-base text-gray-800 leading-relaxed">{s.replace(/________/g, item.target_word)}</p></div>
            </div>)}</div> :
             <div className="p-4 bg-white/50 rounded-lg text-center"><p className="text-sm text-gray-500">暂无额外例句</p></div>}
            {item.memory_tip && <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200"><p className="text-xs text-yellow-800 flex items-start gap-1.5"><HelpCircle size={14} className="shrink-0 mt-0.5 text-yellow-600" /><span>{item.memory_tip}</span></p></div>}
          </div>
          <div className="mt-auto pt-3 border-t border-blue-200/50"><div className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-green-500/60 mt-1.5 shrink-0" title="原句"></span><p className="text-sm text-gray-700 leading-relaxed">{item.sentence}</p></div></div>
        </div>
      </div>
    </div>
  );
}

export default FlipCard;
