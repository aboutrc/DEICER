import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, AlertTriangle, Volume2, Loader2 } from 'lucide-react';
import OpenAI from 'openai';
import { translations } from '../translations';
import AudioPlayer from './AudioPlayer';
import { myhomeStatements } from '../lib/audioStatements';
import { useIsMobile } from '../hooks/useIsMobile';

interface ProtectProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

const Protect: React.FC<ProtectProps> = ({ language = 'en' }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isApiConfigured, setIsApiConfigured] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isMobile = useIsMobile();
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const openaiRef = useRef<OpenAI | null>(null);
  const t = translations[language];

  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey) {
      openaiRef.current = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });
      setIsApiConfigured(true);
    } else {
      console.error("OpenAI API key not found in environment variables");
      setIsApiConfigured(false);
      setError('OpenAI API key not configured.');
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
        setError('OpenAI API not configured.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const finalMimeType = mimeType || 'audio/wav';

      let mediaRecorderOptions: MediaRecorderOptions = {
        audioBitsPerSecond: isMobile ? 64000 : 96000
      };
      if (MediaRecorder.isTypeSupported(finalMimeType)) {
        mediaRecorderOptions.mimeType = finalMimeType;
      }

      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(chunksRef.current, { type: finalMimeType });
          await processAudio(audioBlob);
        } catch (err) {
          console.error('Error processing audio:', err);
          setError('Error processing audio.');
        }
      };

      mediaRecorder.start(1000);
      setIsListening(true);

      // Mobile vibration feedback
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    } catch (err) {
      console.error('Error starting microphone:', err);
      setError('Error accessing microphone.');
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

      // Mobile vibration feedback
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  };

  const getSupportedMimeType = () => {
    const types = [
      'audio/wav',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mpeg',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/x-m4a'
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
      setIsUploading(true);

      if (!openaiRef.current) throw new Error('OpenAI client not initialized');

      const extension = audioBlob.type.includes('wav') ? 'wav' :
                        audioBlob.type.includes('mpeg') ? 'mp3' :
                        audioBlob.type.includes('ogg') ? 'ogg' :
                        audioBlob.type.includes('webm') ? 'webm' :
                        'wav';

      const file = new File([audioBlob], `audio.${extension}`, { type: audioBlob.type });

      let transcription;
      try {
        console.log('Sending audio to OpenAI for transcription...');
        transcription = await openaiRef.current.audio.transcriptions.create({
          file,
          model: 'whisper-1',
          language: 'en'
        });
        console.log('Transcription received:', transcription.text);
      } catch (error) {
        console.warn('First transcription attempt failed, retrying with WAV fallback.');
        const fallbackBlob = await reencodeToWav(audioBlob);
        const fallbackFile = new File([fallbackBlob], 'audio.wav', { type: 'audio/wav' });
        transcription = await openaiRef.current.audio.transcriptions.create({
          file: fallbackFile,
          model: 'whisper-1',
          language: 'en'
        });
      }

      setTranscript(transcription.text);

      console.log('Sending transcription to OpenAI for translation...');
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
            }. Maintain tone and meaning. Only reply with the translation.`
          },
          {
            role: 'user',
            content: transcription.text
          }
        ]
      });

      const translatedText = completion.choices[0].message.content;
      console.log('Translation received:', translatedText);
      setTranslation(translatedText || '');
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Error processing audio.');
    } finally {
      setIsTranslating(false);
      setIsUploading(false);
    }
  };

  const reencodeToWav = async (blob: Blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = await audioBufferToWavBlob(renderedBuffer);
    return wavBlob;
  };

  const audioBufferToWavBlob = (buffer: AudioBuffer) => {
    const numOfChan = buffer.numberOfChannels,
          length = buffer.length * numOfChan * 2 + 44,
          bufferArray = new ArrayBuffer(length),
          view = new DataView(bufferArray),
          channels = [],
          sampleRate = buffer.sampleRate,
          bitDepth = 16;

    let offset = 0;
    const writeString = (s: string) => {
      for (let i = 0; i < s.length; i++) {
        view.setUint8(offset + i, s.charCodeAt(i));
      }
      offset += s.length;
    };

    writeString('RIFF');
    view.setUint32(offset, length - 8, true); offset += 4;
    writeString('WAVE');
    writeString('fmt ');
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, numOfChan, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * numOfChan * 2, true); offset += 4;
    view.setUint16(offset, numOfChan * 2, true); offset += 2;
    view.setUint16(offset, bitDepth, true); offset += 2;
    writeString('data');
    view.setUint32(offset, length - offset - 4, true); offset += 4;

    for (let i = 0; i < buffer.numberOfChannels; i++)
      channels.push(buffer.getChannelData(i));

    for (let i = 0; i < buffer.length; i++)
      for (let chan = 0; chan < numOfChan; chan++) {
        let sample = Math.max(-1, Math.min(1, channels[chan][i]));
        sample = (sample * 32767) | 0;
        view.setInt16(offset, sample, true);
        offset += 2;
      }

    return new Blob([view], { type: 'audio/wav' });
  };

  return (
    <>
      <div className={`min-h-screen bg-gray-900 ${language === 'ar' ? 'rtl' : 'ltr'} h-full overflow-y-auto`}>
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
                 'Place your phone near the door to listen and translate English to your language.'}
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
    </>
  );
};

export default Protect;