import React, { useState, useEffect, useRef } from 'react';
import { translations } from '../translations';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { redCardStatements } from '../lib/audioStatements'; 
import AudioPlayer from './AudioPlayer';
import { Play, Square, AlertTriangle, Loader2, Mic } from 'lucide-react';

const ELEVENLABS_API_KEY = 'sk_fc3cf065a531918b6de89add71bc3cf8633fdcc4c225e29b';
const VOICE_ID = 'pqHfZKP75CvOlQylNhV4';

interface RedCardProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

interface AudioButton {
  title: {
    en: string;
    es: string;
    zh: string;
  };
  text: {
    en: string;
    es: string;
    zh: string;
  };
}

const RedCard = ({ language }: RedCardProps) => {
  const [showEnglish, setShowEnglish] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [isSaving, setIsSaving] = useState(false);
  const t = translations[language || 'en'];
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // This effect will handle recording state when audio is playing
  useEffect(() => {
    // We don't need to pause recording when audio plays
    // Instead, we'll let both continue simultaneously to capture the audio playback
    console.log('Audio playing state changed:', isAudioPlaying);
  }, [isAudioPlaying]);
  
  // This effect will pause recording when audio is playing and resume after
  useEffect(() => {
    if (isAudioPlaying && mediaRecorderRef.current && isRecording) {
      // Temporarily pause recording while audio plays
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
        console.log('Recording paused while audio plays');
      }
    } else if (!isAudioPlaying && mediaRecorderRef.current && isRecording) {
      // Resume recording after audio finishes
      if (mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
        console.log('Recording resumed after audio finished');
      }
    }
  }, [isAudioPlaying, isRecording]);
  
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
        es: "Notificación de Grabación"
      },
      text: {
        en: "This conversation is being recorded for my documentation should I need it. I choose to excersise my 5th Amendment rights under the United States Constitution",
        es: "Esta conversación está siendo grabada para mi documentación en caso de que la necesite. Elijo ejercer mis derechos de la Quinta Enmienda bajo la Constitución de los Estados Unidos"
      }
    },
    {
      title: {
        en: "Constitutional Rights",
        es: "Derechos Constitucionales"
      },
      text: {
        en: "I do not wish to speak with you, answer your questions, or sign or hand you any documents based on my 5th Amendment rights under the United States Constitution.",
        es: "No deseo hablar con usted, responder sus preguntas, ni firmar o entregarle documentos basándome en mis derechos de la Quinta Enmienda bajo la Constitución de los Estados Unidos."
      }
    },
    {
      title: {
        en: "No Permission to Search",
        es: "Sin Permiso para Registrar"
      },
      text: {
        en: "I do not give you permission to search any of my belongings based on my 4th Amendment rights.",
        es: "No le doy permiso para registrar ninguna de mis pertenencias basándome en mis derechos de la Cuarta Enmienda."
      }
    },
    {
      title: {
        en: "Request Badge Numbers",
        es: "Solicitar Números de Placa"
      },
      text: {
        en: "I would request badge numbers from all officers present.",
        es: "Solicito los números de placa de todos los oficiales presentes."
      }
    },
    {
      title: {
        en: "Free to Go?",
        es: "¿Libre para Irme?"
      },
      text: {
        en: "Am I free to go? Yes or No.",
        es: "¿Soy libre de irme? Sí o No."
      }
    },
    {
      title: {
        en: "Thank you. Goodbye.",
        es: "Gracias. Adiós."
      },
      text: {
        en: "Thank you. I have documented this for my evidence. Have a good day Officer.",
        es: "Gracias. He documentado esto como evidencia. Que tenga un buen día, Oficial."
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
      
      const { data: uploadData, error: uploadError } = await supabase.storage
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

  const generateAndPlaySpeech = async (text: string, index: number) => {
    try {
      if (currentlyPlaying === index) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setCurrentlyPlaying(null);
        return;
      }

      setIsGenerating(true);
      setError(null);
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = url;
      audioRef.current.volume = 1.0;
      
      // Set audio playing state
      setIsAudioPlaying(true);
      
      audioRef.current.onended = () => {
        setCurrentlyPlaying(null);
        setIsAudioPlaying(false);
        URL.revokeObjectURL(url);
      };

      await audioRef.current.play();
      setCurrentlyPlaying(index);
    } catch (err) {
      console.error('Speech generation error:', err);
      setError(language === 'es' 
        ? 'Error al generar el audio. Por favor, intente de nuevo.'
        : 'Failed to generate speech. Please try again.');
      setCurrentlyPlaying(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Card text content
  const cardContent = {
    en: {
      title: "Constitutional Rights Card",
      rights: [
        "I do not wish to speak with you, answer your questions, or sign or hand you any documents based on my 5th Amendment rights under the United States Constitution.",
        "I do not give you permission to enter my home based on my 4th Amendment rights under the United States Constitution unless you have a warrant to enter, signed by a judge or magistrate with my name on it that you slide under the door.",
        "I do not give you permission to search any of my belongings based on my 4th Amendment rights.",
        "I choose to exercise my constitutional rights.",
        "These cards are available to citizens and noncitizens alike."
      ]
    },
    es: {
      title: "Tarjeta de Derechos Constitucionales",
      rights: [
        "NO CONTESTE NINGUNA PREGUNTA de un agente de inmigración si él trata de hablar con usted. Usted tiene el derecho de mantenerse callado.",
        "NO ABRA LA PUERTA si un agente de inmigración está tocando la puerta.",
        "NO FIRME NADA sin antes hablar con un abogado. Usted tiene el derecho de hablar con un abogado.",
        "Si usted está afuera de su casa, pregunte al agente si es libre para irse y si dice que sí, váyase con tranquilidad.",
        "ENTREGUE ESTA TARJETA AL AGENTE. Si usted está dentro de su casa, muestre la tarjeta por la ventana o pásela debajo de la puerta."
      ]
    },
    zh: {
      title: "宪法权利卡",
      rights: [
        "根据美国宪法第五修正案赋予我的权利，我不希望与您交谈，回答您的问题，或签署或交给您任何文件。",
        "根据美国宪法第四修正案赋予我的权利，除非您有由法官或治安法官签署的、写有我名字的搜查令并将其从门下递进来，否则我不允许您进入我的家。",
        "根据我的第四修正案权利，我不允许您搜查我的任何物品。",
        "我选择行使我的宪法权利。",
        "这些卡片适用于公民和非公民。"
      ]
    }
  };

  return (
    <div className={`bg-gray-900 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-[#660000] backdrop-blur-sm rounded-lg p-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-white text-center">
              {t.redCard?.title || translations.en.redCard.title}
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
                      (t.redCard?.startRecording || translations.en.redCard.startRecording)}
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

        {error && (
          <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="bg-[#660000] backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            {language === 'hi' ? 'पूर्व-रिकॉर्ड की गई प्रतिक्रियाएँ' :
             language === 'es' ? 'Respuestas Pregrabadas' :
             language === 'zh' ? '预录制回应' :
             language === 'ar' ? 'ردود مسجلة مسبقًا' :
             'Pre-recorded Responses'}
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
               'Saved Recordings'}
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
                               'Copy Link'}
                      >
                        {language === 'es' ? 'Copiar' : 
                         language === 'zh' ? '复制' : 
                         language === 'hi' ? 'कॉपी करें' : 
                         language === 'ar' ? 'نسخ' :
                         'Copy Link'}
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