import React, { useState, useRef, useEffect } from 'react';
import { Play, AlertTriangle } from 'lucide-react';
import { myhomeStatements, proofStatements, redCardStatements } from '../lib/audioStatements';

interface AudioPlayerProps {
  speakerMode?: boolean;
  useMyhomeStatements?: boolean;
  useRedCardStatements?: boolean;
  statements?: typeof myhomeStatements;
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
  onPlayStateChange?: (isPlaying: boolean) => void;
}

const AudioPlayer = ({ 
  speakerMode = false, 
  useMyhomeStatements = false,
  useRedCardStatements = false,
  statements: customStatements,
  language = 'en',
  onPlayStateChange
}: AudioPlayerProps) => {
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApiConfigured, setIsApiConfigured] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const maxRetries = 3;
  const retryDelay = 2000;

  const statements = customStatements || 
    (useRedCardStatements ? redCardStatements : 
     useMyhomeStatements ? myhomeStatements : 
     proofStatements);

  useEffect(() => {
    setIsApiConfigured(true);
  }, [speakerMode]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const generateAndPlaySpeech = async (text: string) => {
    try {
      if (currentPlaying === text) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          if (onPlayStateChange) onPlayStateChange(false);
        }
        setCurrentPlaying(null);
        return;
      }

      setError(null);
      setIsGenerating(true);

      // Get the corresponding audio file name based on the text
      const audioFileName = statements.find(s => s.text === text)?.audioFile;
      if (!audioFileName) {
        throw new Error('Audio file not found');
      }
      
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = `/audio/${audioFileName}`;
      
      // Set audio to play through speakerphone if supported
      if (speakerMode && audioRef.current.setSinkId) {
        try {
          await audioRef.current.setSinkId('default');
          console.log('Audio output set to speakerphone');
        } catch (err) {
          console.warn('setSinkId not supported or failed:', err);
        }
      }

      audioRef.current.onended = () => {
        setCurrentPlaying(null);
        if (onPlayStateChange) onPlayStateChange(false);
      };

      await audioRef.current.play();
      if (onPlayStateChange) onPlayStateChange(true);
      setCurrentPlaying(text);
    } catch (err) {
      console.error('Speech generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate speech. Please try again.');
      setCurrentPlaying(null);
      if (onPlayStateChange) onPlayStateChange(false);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isApiConfigured) {
    return (
      <div className="w-full max-w-2xl mt-8">
        <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <span>Audio playback is not configured. Please check your device settings.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mt-8">
      {error && (
        <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <span>
            {language === 'zh' ? '无法生成语音。请重试。' : 
             language === 'ar' ? 'فشل في إنشاء الكلام. يرجى المحاولة مرة أخرى.' : 
             error}
          </span>
        </div>
      )}
      
      <div className="grid gap-4">
        {statements.map((audio) => {
          const isPlaying = currentPlaying === audio.text;
          const isDisabled = isGenerating && currentPlaying !== audio.text;
          const title = language === 'es' ? audio.title.es : 
                        language === 'zh' && audio.title.zh ? audio.title.zh : 
                        language === 'hi' && audio.title.hi ? audio.title.hi : 
                        language === 'ar' && audio.title.ar ? audio.title.ar : 
                        audio.title.en;

          return (
            <div 
              key={title}
              className={`bg-black/30 backdrop-blur-sm rounded-lg p-4 hover:bg-black/40 transition-colors ${language === 'ar' ? 'rtl' : 'ltr'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-100">{title}</h3>
                  <p className="text-gray-400 mt-2">
                    {language === 'en' ? audio.text : 
                     language === 'es' ? (audio.translation || audio.text) : 
                     language === 'zh' && audio.translationZh ? audio.translationZh :
                     language === 'hi' && audio.translationHi ? audio.translationHi :
                     language === 'ar' && audio.translationAr ? audio.translationAr :
                     audio.text}
                  </p>
                </div>
                <button
                  onClick={() => generateAndPlaySpeech(audio.text)}
                  disabled={isDisabled}
                  className={`p-3 rounded-full transition-colors ${
                    isPlaying 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : isDisabled
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                  }`}
                >
                  <Play size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AudioPlayer;