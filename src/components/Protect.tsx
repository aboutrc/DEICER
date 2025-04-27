import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, AlertTriangle, Volume2, Loader2 } from 'lucide-react';
import OpenAI from 'openai';
import { translations } from '../translations';
import AudioPlayer from './AudioPlayer';
import { myhomeStatements } from '../lib/audioStatements';

interface ProtectProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

const Protect: React.FC<ProtectProps> = ({ language = 'en' }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const openaiRef = useRef<OpenAI | null>(null);
  const t = translations[language];

  // Initialize OpenAI client
  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    console.log("API Key available:", !!apiKey);
    if (apiKey) {
      openaiRef.current = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Note: In production, you should use a backend proxy
      });
      setIsApiConfigured(true);
    } else {
      console.error("OpenAI API key not found in environment variables");
      setIsApiConfigured(false);
      setError('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startListening = async () => {
    try {
      setError(null);
      
      if (!isApiConfigured) {
        setError('OpenAI API is not configured. Please add your API key to the environment variables.');
        return;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      
      // Create media recorder
      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        throw new Error('No supported audio MIME type found');
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          await processAudio(audioBlob);
        } catch (err) {
          console.error('Error processing audio:', err);
          setError('Error processing audio. Please try again.');
        }
      };
      
      // Start recording
      mediaRecorder.start(1000);
      setIsListening(true);
    } catch (err) {
      console.error('Error starting microphone:', err);
      setError('Error accessing microphone. Please check permissions and try again.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return null;
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      setIsTranslating(true);
      
      if (!openaiRef.current) {
        throw new Error('OpenAI client not initialized');
      }
      
      // Convert blob to file
      const file = new File([audioBlob], 'audio.webm', { type: audioBlob.type });
      
      // Transcribe audio using OpenAI Whisper
      const transcription = await openaiRef.current.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language: 'en'
      });
      
      setTranscript(transcription.text);
      
      // Translate the transcription to Spanish
      const completion = await openaiRef.current.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following English text to ${
              language === 'es' ? 'Spanish' : 
              language === 'zh' ? 'Chinese' : 
              language === 'hi' ? 'Hindi' : 
              language === 'ar' ? 'Arabic' : 'Spanish'
            }. Maintain the tone and meaning of the original text. Only respond with the translation, nothing else.`
          },
          {
            role: 'user',
            content: transcription.text
          }
        ]
      });
      
      const translatedText = completion.choices[0].message.content;
      setTranslation(translatedText || '');
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Error processing audio. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-900 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* API Configuration Error */}
        {!isApiConfigured && (
          <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <span>OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.</span>
          </div>
        )}
        
        {/* Real-time Translation Section */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {language === 'es' ? 'Traducción en Tiempo Real' : 
               language === 'zh' ? '实时翻译' : 
               language === 'hi' ? 'रीयल-टाइम अनुवाद' : 
               language === 'ar' ? 'الترجمة في الوقت الحقيقي' : 
               'Real-time Translation'}
            </h2>
            
            <p className="text-gray-300 mb-4">
              {language === 'es' ? 'Coloca tu teléfono cerca de la puerta para escuchar y traducir el inglés a español.' : 
               language === 'zh' ? '将手机放在门附近，听取并将英语翻译成中文。' : 
               language === 'hi' ? 'अपने फोन को दरवाजे के पास रखें और अंग्रेजी को हिंदी में सुनें और अनुवाद करें।' : 
               language === 'ar' ? 'ضع هاتفك بالقرب من الباب للاستماع وترجمة اللغة الإنجليزية إلى العربية.' : 
               'Place your phone near the door to listen and translate English to Spanish.'}
            </p>
            
            {error && (
              <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="flex justify-center mb-6">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={!isApiConfigured || isTranslating}
                className={`px-6 py-3 rounded-full flex items-center gap-2 ${
                  isListening 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white font-medium transition-colors ${
                  (!isApiConfigured || isTranslating) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isListening ? (
                  <>
                    <Square size={20} />
                    <span>
                      {language === 'es' ? 'Detener Escucha' : 
                       language === 'zh' ? '停止收听' : 
                       language === 'hi' ? 'सुनना बंद करें' : 
                       language === 'ar' ? 'توقف عن الاستماع' : 
                       'Stop Listening'}
                    </span>
                  </>
                ) : (
                  <>
                    <Mic size={20} />
                    <span>
                      {language === 'es' ? 'Comenzar a Escuchar' : 
                       language === 'zh' ? '开始收听' : 
                       language === 'hi' ? 'सुनना शुरू करें' : 
                       language === 'ar' ? 'ابدأ الاستماع' : 
                       'Start Listening'}
                    </span>
                  </>
                )}
              </button>
            </div>
            
            {isTranslating && (
              <div className="flex justify-center items-center py-4">
                <Loader2 size={24} className="animate-spin text-blue-500" />
                <span className="ml-2 text-gray-300">
                  {language === 'es' ? 'Traduciendo...' : 
                   language === 'zh' ? '翻译中...' : 
                   language === 'hi' ? 'अनुवाद कर रहा है...' : 
                   language === 'ar' ? 'جاري الترجمة...' : 
                   'Translating...'}
                </span>
              </div>
            )}
            
            {/* Display area for transcription and translation */}
            <div className="space-y-4 mt-4">
              {transcript && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    {language === 'es' ? 'Texto en Inglés:' : 
                     language === 'zh' ? '英文文本:' : 
                     language === 'hi' ? 'अंग्रेजी पाठ:' : 
                     language === 'ar' ? 'النص الإنجليزي:' : 
                     'English Text:'}
                  </h3>
                  <p className="text-white">{transcript}</p>
                </div>
              )}
              
              {translation && (
                <div className="bg-blue-900/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-300 mb-1">
                    {language === 'es' ? 'Traducción:' : 
                     language === 'zh' ? '翻译:' : 
                     language === 'hi' ? 'अनुवाद:' : 
                     language === 'ar' ? 'الترجمة:' : 
                     'Translation:'}
                  </h3>
                  <p className="text-white">{translation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Pre-made Audio Responses Section */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {language === 'es' ? 'Respuestas de Audio Pregrabadas' : 
               language === 'zh' ? '预录制音频回复' : 
               language === 'hi' ? 'पूर्व-रिकॉर्ड किए गए ऑडियो उत्तर' : 
               language === 'ar' ? 'ردود صوتية مسجلة مسبقًا' : 
               'Pre-recorded Audio Responses'}
            </h2>
            
            <p className="text-gray-300 mb-4">
              {language === 'es' ? 'Haz clic en un botón para reproducir una respuesta pregrabada en inglés.' : 
               language === 'zh' ? '点击按钮播放预先录制的英语回复。' : 
               language === 'hi' ? 'पूर्व-रिकॉर्ड किए गए अंग्रेजी उत्तर चलाने के लिए बटन पर क्लिक करें।' : 
               language === 'ar' ? 'انقر على زر لتشغيل رد مسجل مسبقًا باللغة الإنجليزية.' : 
               'Click a button to play a pre-recorded English response.'}
            </p>
            
            <AudioPlayer 
              speakerMode={true}
              useMyhomeStatements={true}
              language={language}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Protect;