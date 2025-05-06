import React, { useState, useEffect, useRef } from 'react';
import { translations } from '../translations';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { redCardStatements } from '../lib/audioStatements';
import AudioPlayer from './AudioPlayer';
import { Play, Square, AlertTriangle, Loader2, Mic } from 'lucide-react';

interface RedCardProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

interface AudioButton {
  title: {
    en: string;
    es: string;
    zh?: string;
    hi?: string;
    ar?: string;
  };
  text: {
    en: string;
    es: string;
    zh?: string;
    hi?: string;
    ar?: string;
  };
}

const RedCard = ({ language = 'en' }: RedCardProps) => {
  const [showEnglish, setShowEnglish] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [isSaving, setIsSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const t = translations[language] || translations.en;
  
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

  const audioButtons: AudioButton[] = [
    {
      title: {
        en: "Recording Notification",
        es: "Notificación de Grabación",
        zh: "录音通知",
        hi: "रिकॉर्डिंग सूचना",
        ar: "إشعار التسجيل"
      },
      text: {
        en: "This conversation is being recorded for my documentation should I need it. I choose to excersise my 5th Amendment rights under the United States Constitution",
        es: "Esta conversación está siendo grabada para mi documentación en caso de que la necesite. Elijo ejercer mis derechos de la Quinta Enmienda bajo la Constitución de los Estados Unidos",
        zh: "这段对话正在被录音，以便我在需要时作为文档记录。我选择行使美国宪法第五修正案赋予我的权利",
        hi: "यह वार्तालाप मेरे दस्तावेज़ीकरण के लिए रिकॉर्ड की जा रही है, अगर मुझे इसकी आवश्यकता हो। मैं अमेरिकी संविधान के तहत अपने 5वें संशोधन के अधिकारों का प्रयोग करने का चयन करता हूं",
        ar: "يتم تسجيل هذه المحادثة لتوثيقي إذا احتجت إليها. أختار ممارسة حقوقي بموجب التعديل الخامس من دستور الولايات المتحدة"
      }
    },
    {
      title: {
        en: "Constitutional Rights",
        es: "Derechos Constitucionales",
        zh: "宪法权利",
        hi: "संवैधानिक अधिकार",
        ar: "الحقوق الدستورية"
      },
      text: {
        en: "I do not wish to speak with you, answer your questions, or sign or hand you any documents based on my 5th Amendment rights under the United States Constitution.",
        es: "No deseo hablar con usted, responder sus preguntas, ni firmar o entregarle documentos basándome en mis derechos de la Quinta Enmienda bajo la Constitución de los Estados Unidos.",
        zh: "根据美国宪法第五修正案赋予我的权利，我不希望与您交谈，回答您的问题，或签署或交给您任何文件。",
        hi: "मैं अमेरिकी संविधान के तहत अपने 5वें संशोधन के अधिकारों के आधार पर आपसे बात करना, आपके प्रश्नों का उत्तर देना, या कोई दस्तावेज़ हस्ताक्षरित करना या आपको देना नहीं चाहता हूं।",
        ar: "لا أرغب في التحدث معك، أو الإجابة على أسئلتك، أو التوقيع أو تسليمك أي مستندات بناءً على حقوقي بموجب التعديل الخامس من دستور الولايات المتحدة."
      }
    },
    {
      title: {
        en: "No Permission to Search",
        es: "Sin Permiso para Registrar",
        zh: "不允许搜查",
        hi: "तलाशी की अनुमति नहीं",
        ar: "لا إذن للتفتيش"
      },
      text: {
        en: "I do not give you permission to search any of my belongings based on my 4th Amendment rights.",
        es: "No le doy permiso para registrar ninguna de mis pertenencias basándome en mis derechos de la Cuarta Enmienda.",
        zh: "根据我的第四修正案权利，我不允许您搜查我的任何物品。",
        hi: "मैं अपने चौथे संशोधन के अधिकारों के आधार पर आपको अपनी किसी भी संपत्ति की तलाशी लेने की अनुमति नहीं देता हूं।",
        ar: "لا أعطيك إذنًا بتفتيش أي من ممتلكاتي بناءً على حقوقي بموجب التعديل الرابع."
      }
    },
    {
      title: {
        en: "Request Badge Numbers",
        es: "Solicitar Números de Placa",
        zh: "要求警徽号码",
        hi: "बैज नंबर का अनुरोध",
        ar: "طلب أرقام الشارات"
      },
      text: {
        en: "I would request badge numbers from all officers present.",
        es: "Solicito los números de placa de todos los oficiales presentes.",
        zh: "我要求在场所有警官出示警徽号码。",
        hi: "मैं उपस्थित सभी अधिकारियों से बैज नंबर का अनुरोध करूंगा।",
        ar: "أطلب أرقام الشارات من جميع الضباط الحاضرين."
      }
    },
    {
      title: {
        en: "Free to Go?",
        es: "¿Libre para Irme?",
        zh: "可以离开吗？",
        hi: "क्या मैं जा सकता हूँ?",
        ar: "هل أنا حر في المغادرة؟"
      },
      text: {
        en: "Am I free to go? Yes or No.",
        es: "¿Soy libre de irme? Sí o No.",
        zh: "我可以离开吗？是或否。",
        hi: "क्या मैं जाने के लिए स्वतंत्र हूँ? हाँ या नहीं।",
        ar: "هل أنا حر في المغادرة؟ نعم أم لا."
      }
    },
    {
      title: {
        en: "Thank you. Goodbye.",
        es: "Gracias. Adiós.",
        zh: "谢谢。再见。",
        hi: "धन्यवाद। अलविदा।",
        ar: "شكرا. وداعا."
      },
      text: {
        en: "Thank you. I have documented this for my evidence. Have a good day Officer.",
        es: "Gracias. He documentado esto como evidencia. Que tenga un buen día, Oficial.",
        zh: "谢谢。我已将此作为证据记录在案。祝您有愉快的一天，警官。",
        hi: "धन्यवाद। मैंने इसे अपने सबूत के लिए दस्तावेज़ीकृत कर लिया है। आपका दिन शुभ हो, अधिकारी।",
        ar: "شكرا. لقد وثقت هذا كدليل. أتمنى لك يوما طيبا أيها الضابط."
      }
    }
  ];

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.error('Location error:', err);
          setError(language === 'es' 
            ? 'No se pudo obtener la ubicación'
            : 'Could not get location');
        }
      );
    }

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false, 
          autoGainControl: false
        } 
      });

      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        throw new Error('No supported audio MIME type found');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        await saveRecording(audioBlob);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Microphone access error:', err);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError(language === 'es'
            ? 'Acceso al micrófono denegado. Por favor, cierre y vuelva a abrir la página, luego intente de nuevo.'
            : 'Microphone access denied. Please close and reopen the page, then try again.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError(language === 'es'
            ? 'No se encontró micrófono. Por favor, conecte un micrófono e intente de nuevo.'
            : 'No microphone found. Please connect a microphone and try again.');
        } else {
          setError(language === 'es'
            ? 'No se puede acceder al micrófono. Por favor, verifique la configuración de su dispositivo.'
            : 'Unable to access microphone. Please check your device settings.');
        }
      } else {
        setError(language === 'es'
          ? 'Error al iniciar la grabación. Por favor, verifique los permisos del micrófono.'
          : 'Error starting recording. Please check microphone permissions.');
      }
      
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = async (audioBlob: Blob) => {
    try {
      setIsSaving(true);
      const extension = 'webm';
      const fileName = `${uuidv4()}.${extension}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('recordings')
        .insert({
          recording_url: fileName,
          location: location ? `${location.lat},${location.lng}` : null,
          public_url: publicUrl,
          session_id: sessionId
        });

      if (dbError) throw dbError;

      await fetchRecordings();
      setError(null);
    } catch (err) {
      console.error('Save recording error:', err);
      setError(language === 'es'
        ? 'Error al guardar la grabación'
        : 'Error saving recording');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchRecordings = async () => {
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setRecordings(data);
    } catch (err) {
      console.error('Error fetching recordings:', err);
      setError(language === 'es'
        ? 'Error al cargar las grabaciones'
        : 'Error loading recordings');
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(
      language === 'es' ? 'es-ES' : 'en-US',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }
    );
  };

  const copyRecordingLink = async (recording: any) => {
    try {
      await navigator.clipboard.writeText(recording.public_url);
      setError(language === 'es'
        ? 'Enlace copiado al portapapeles'
        : 'Link copied to clipboard');
      setTimeout(() => setError(null), 2000);
    } catch (err) {
      console.error('Copy error:', err);
      setError(language === 'es'
        ? 'Error al copiar el enlace'
        : 'Error copying link');
    }
  };

  return (
    <div className={`bg-gray-900 ${language === 'ar' ? 'rtl' : 'ltr'} h-full overflow-y-auto`}>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-[#660000] backdrop-blur-sm rounded-lg p-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-white text-center">
              {language === 'es' ? 'Tarjeta Roja Digital' :
               language === 'zh' ? '数字红卡' :
               language === 'hi' ? 'डिजिटल रेड कार्ड' :
               language === 'ar' ? 'بطاقة حمراء رقمية' :
               t.redCard?.title || translations.en.redCard.title}
            </h1>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isSaving}
              className="w-full px-6 py-3 bg-[#993333] hover:bg-[#993333]/90 text-white rounded-lg font-medium flex items-center justify-center gap-2"
            >
              {isRecording ? (
                <>
                  <Square size={20} />
                  <span className="whitespace-nowrap">
                    {t.redCard?.stopRecording || translations.en.redCard.stopRecording}
                  </span>
                </>
              ) : (
                <>
                  <Mic size={20} />
                  <span className="whitespace-nowrap">
                    {isSaving ? 
                      (t.redCard?.saving || translations.en.redCard.saving) :
                      (language === 'es' ? 'Haz clic para comenzar a grabar' :
                       language === 'zh' ? '点击开始录音' :
                       language === 'hi' ? 'रिकॉर्डिंग शुरू करने के लिए क्लिक करें' :
                       language === 'ar' ? 'انقر لبدء التسجيل' :
                       t.redCard?.startRecording || translations.en.redCard.startRecording)}
                  </span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-900/50 text-red-100 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle size={20} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="bg-[#660000] backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            {language === 'hi' ? 'पूर्व-रिकॉर्ड की गई प्रतिक्रियाएँ' :
             language === 'es' ? 'Respuestas Pregrabadas' :
             language === 'zh' ? '预录制回应' :
             language === 'ar' ? 'ردود مسجلة مسبقًا' :
             t.redCard?.preRecorded || 'Pre-recorded Responses'}
          </h2>
          <AudioPlayer
            speakerMode={true} 
            language={language}
            statements={redCardStatements}
            onPlayStateChange={setIsAudioPlaying}
          />
        </div>

        {recordings.length > 0 && (
          <div className="bg-[#660000] backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">
              {language === 'hi' ? 'सहेजी गई रिकॉर्डिंग' :
               language === 'es' ? 'Grabaciones Guardadas' : 
               language === 'zh' ? '已保存的录音' : 
               language === 'ar' ? 'التسجيلات المحفوظة' :
               t.redCard?.savedRecordings || 'Saved Recordings'}
            </h2>
            
            <div className="space-y-4">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="bg-[#993333] backdrop-blur-sm rounded-lg p-4 hover:bg-[#993333]/90 transition-colors"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="text-gray-300 text-sm">
                          {formatDate(recording.created_at)}
                        </div>
                        {recording.location && (
                          <div className="text-gray-400 text-sm">
                            {recording.location}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <audio
                        src={recording.public_url}
                        onPlay={() => setIsAudioPlaying(true)}
                        onEnded={() => setIsAudioPlaying(false)}
                        onPause={() => setIsAudioPlaying(false)}
                        controls
                        className="flex-1 h-8"
                        onError={(e) => {
                          console.error('Audio playback error:', e);
                          setError(language === 'es'
                            ? 'Error al reproducir el audio'
                            : 'Error playing audio');
                        }}
                      />
                      <button
                        onClick={() => copyRecordingLink(recording)}
                        className="p-2 text-gray-400 hover:text-gray-300 hover:bg-[#cc4444] rounded-lg transition-colors"
                        title={language === 'es' ? 'Copiar Enlace' : 
                               language === 'zh' ? '复制链接' : 
                               language === 'hi' ? 'लिंक कॉपी करें' : 
                               language === 'ar' ? 'نسخ الرابط' :
                               t.redCard?.copyLink || 'Copy Link'}
                      >
                        {language === 'es' ? 'Copiar' : 
                         language === 'zh' ? '复制' : 
                         language === 'hi' ? 'कॉपी करें' : 
                         language === 'ar' ? 'نسخ' :
                         t.redCard?.copy || 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedCard;