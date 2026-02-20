import { useState, useCallback, useEffect, useRef } from 'react';
import { Volume2, HelpCircle, Loader2, ImageIcon } from 'lucide-react';
import { getCachedImage, saveImageToCache } from '../services/imageCache';
import { generateImage } from '../services/api';
import { getWordImageUrl, uploadWordImage, saveWordMedia } from '../services/storage';
import { playTTS } from '../services/tts';

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
      if (studyRecordId) {
        try {
          const cloudUrl = await getWordImageUrl(word, studyRecordId);
          if (cloudUrl) { setWordImage(cloudUrl); await saveImageToCache(word, cloudUrl); return; }
        } catch (e) {}
      }
      const cached = await getCachedImage(word);
      if (cached) { setWordImage(cached); hasGeneratedRef.current = true; return; }
      if (hasGeneratedRef.current || isGeneratingImage) return;
      
      hasGeneratedRef.current = true;
      setIsGeneratingImage(true);
      try {
        const prompt = \`Create a clean, minimalist illustration of "\${word}" for educational flashcards.\`;
        const data = await generateImage(prompt, 1024, 1024);
        const imageBase64 = \`data:\${data.mimeType};base64,\${data.imageBase64}\`;
        setWordImage(imageBase64);
        await saveImageToCache(word, imageBase64);
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
    setIsLoading(true); setIsPlaying(true);
    try { await playTTS(text, { rate: 0.9, lang: 'en-US' }); } catch (e) {}
    finally { setIsLoading(false); setIsPlaying(false); }
  }, [isPlaying, isLoading]);

  const handleFlip = () => setIsFlipped(!isFlipped);

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
    <div className={\`card-container min-h-[550px] h-auto max-h-[800px] cursor-pointer \${isFlipped ? 'flipped' : ''}\`} onClick={handleFlip}>
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
              <button onClick={(e) => playAudio(e, item.target_word)} disabled={isLoading} className={\`w-8 h-8 rounded-full flex items-center justify-center transition-all \${getButtonClass(true)}\`} title="播放单词">
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <span className="text-xs font-bold">Aa</span>}
              </button>
              <button onClick={(e) => playAudio(e, item.sentence)} disabled={isLoading} className={\`w-8 h-8 rounded-full flex items-center justify-center transition-all \${getButtonClass(false)}\`} title="播放例句">
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} className={isPlaying ? 'animate-pulse' : ''} />}
              </button>
            </div>
          </div>
          <div className="rounded-2xl w-[260px] h-[260px] mx-auto flex items-center justify-center mb-3 shrink-0 overflow-hidden bg-white border-2 border-gray-100">
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
            {item.practiceSentences?.length > 0 ? <div className="space-y-3">{item.practiceSentences.slice(0, 3).map((s, i) => <div key={i} className="p-3 bg-white/70 rounded-lg"><p className="text-base text-gray-800 leading-relaxed">{s.replace(/________/g, item.target_word)}</p></div>)}</div> :
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
