import React, { useState, useEffect, useRef } from 'react';
import { Conversation } from '@11labs/client';
import { AlertTriangle } from 'lucide-react';

interface LupeProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

interface VoiceConfig {
  voiceId: string;
  image: string;
}

const languageConfig: Record<string, VoiceConfig> = {
  en: {
    voiceId: 'nPjA5PlVWxRd7L1Ypou4',
    image: '/tia_lupe_w.jpg'
  },
  ar: {
    voiceId: 'pum6281czPCDQE9zKIZA',
    image: '/ar-chtbot.jpg'
  },
  hi: {
    voiceId: 'AdbXj7fLA3RE0roiYR7c',
    image: '/hi-chtbot.jpg'
  },
  zh: {
    voiceId: 'pum6281czPCDQE9zKIZA',
    image: '/zh-chtbot.jpg'
  },
  es: {
    voiceId: 'nPjA5PlVWxRd7L1Ypou4',
    image: '/tia_lupe_w.jpg'
  }
};

const Lupe = ({ language = 'en' }: LupeProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<any>(null);
  const config = languageConfig[language];

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return language === 'zh' ? '已连接' : 
               language === 'es' ? 'Conectado' : 
               language === 'hi' ? 'कनेक्टेड' : 
               language === 'ar' ? 'متصل' : 'Connected';
      case 'disconnected':
        return language === 'zh' ? '未连接' : 
               language === 'es' ? 'Desconectado' : 
               language === 'hi' ? 'डिस्कनेक्टेड' : 
               language === 'ar' ? 'غير متصل' : 'Disconnected';
      case 'speaking':
        return language === 'zh' ? '代理说话中' : 
               language === 'es' ? 'Agente Hablando' : 
               language === 'hi' ? 'एजेंट बोल रहा है' : 
               language === 'ar' ? 'الوكيل يتحدث' : 'Agent Speaking';
      case 'silent':
        return language === 'zh' ? '代理沉默' : 
               language === 'es' ? 'Agente en Silencio' : 
               language === 'hi' ? 'एजेंट मौन है' : 
               language === 'ar' ? 'الوكيل صامت' : 'Agent Silent';
      default:
        return status;
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setError(null);
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setError(
        language === 'zh' 
          ? '需要麦克风权限才能进行对话。' :
          language === 'es'
          ? 'Se requiere permiso de micrófono para la conversación.' :
          language === 'hi' ? 'वार्तालाप के लिए माइक्रोफोन की अनुमति आवश्यक है।' :
          language === 'ar' ? 'إذن الميكروفون مطلوب للمحادثة.' :
          'Microphone permission is required for the conversation.'
      );
      return false;
    }
  };

  const startConversation = async () => {
    try {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        return;
      }

      conversationRef.current = await Conversation.startSession({
        agentId: config.voiceId,
        onConnect: () => {
          console.log('Connected');
          setIsConnected(true);
          setError(null);
        },
        onDisconnect: () => {
          console.log('Disconnected');
          setIsConnected(false);
          setIsSpeaking(false);
          setError(null);
        },
        onError: (error) => {
          console.error('Conversation error:', error);
          setError('An error occurred during the conversation.');
        },
        onModeChange: (mode) => {
          setIsSpeaking(mode.mode === 'speaking');
        }
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('Failed to start conversation. Please try again.');
    }
  };

  const endConversation = async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession();
      }
    };
  }, []);

  return (
    <div className={`bg-gray-900 px-4 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-2xl mx-auto pt-4 text-left">
        <div className="text-gray-300 mb-4">
          <p>
            {language === 'hi' ? (
              <>टिया लूप एक AI सहायक है जिसे{' '}<a href="https://lulac.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">LULAC</a> और{' '}<a href="https://www.aclu.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">ACLU</a> की जानकारी पर प्रशिक्षित किया गया है। वह आपके अधिकारों, आव्रजन प्रक्रियाओं और संयुक्त राज्य अमेरिका में कानूनी सुरक्षा के बारे में प्रश्नों का उत्तर दे सकती है।</>
            ) : language === 'ar' ? (
              <>تيا لوبي هي مساعدة ذكاء اصطناعي مدربة على معلومات من{' '}<a href="https://lulac.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">LULAC</a> و{' '}<a href="https://www.aclu.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">ACLU</a>. يمكنها الإجابة على أسئلة حول حقوقك وعمليات الهجرة والحماية القانونية في الولايات المتحدة.</>
            ) : language === 'zh' ? (
              <>
                露佩阿姨是一位人工智能助手，她接受了来自{' '}
                <a href="https://lulac.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  LULAC
                </a> 和{' '}
                <a href="https://www.aclu.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  ACLU
                </a> 的信息培训。她可以回答关于您的权利、移民程序和在美国的法律保护等问题。
              </>
            ) : language === 'es' ? (
              <>
                Tía Lupe es una asistente de IA entrenada con información de{' '}
                <a href="https://lulac.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  LULAC
                </a> y la{' '}
                <a href="https://www.aclu.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  ACLU
                </a>. Puede responder preguntas sobre tus derechos, procesos migratorios y protecciones legales en los Estados Unidos.
              </>
            ) : (
              <>
                Tía Lupe is an AI assistant trained on information from{' '}
                <a href="https://lulac.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  LULAC
                </a> and the{' '}
                <a href="https://www.aclu.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  ACLU
                </a>. She can answer questions about your rights, immigration processes, and legal protections in the United States.
              </>
            )}
          </p>
        </div>

        <div className="bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg border border-gray-700 mb-4">
          {error && (
            <div className="bg-red-900/50 text-red-100 px-4 py-3 flex items-center gap-2">
              <AlertTriangle size={20} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Content Container */}
          <div className="relative">
            {/* Status Indicators - Top Right */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <div
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg ${
                  isConnected
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {getStatusText(isConnected ? 'connected' : 'disconnected')}
              </div>
              <div
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg ${isSpeaking ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}`}
              >
                {getStatusText(isSpeaking ? 'speaking' : 'silent')}
              </div>
            </div>
            {/* Image Container */}
            <div className="relative w-full aspect-[4/3] md:aspect-[3/2] rounded-xl overflow-hidden shadow-2xl">
              <img
                src={config.image}
                alt="AI Assistant Avatar"
                className={`w-full h-full object-cover transition-transform duration-300 ${
                  isSpeaking ? 'scale-[1.02]' : ''
                }`}
              />
              <div
                className={`absolute bottom-4 right-4 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-colors duration-300 ${
                  isSpeaking ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            </div>

            {/* Control Buttons - Bottom */}
            <div className="absolute -bottom-4 left-0 right-0 flex justify-center gap-2 mb-8">
              <button
                onClick={startConversation}
                disabled={isConnected}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg ${
                  isConnected
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500'
                } text-white`}
              >
                {language === 'zh' ? '开始对话' : 
                 language === 'es' ? 'Iniciar Conversación' : 
                 language === 'hi' ? 'वार्तालाप शुरू करें' : 
                 language === 'ar' ? 'بدء المحادثة' :
                 'Start Conversation'}
              </button>
              <button
                onClick={endConversation}
                disabled={!isConnected}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg ${
                  !isConnected
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500'
                } text-white`}
              >
                {language === 'zh' ? '结束对话' : 
                 language === 'es' ? 'Terminar Conversación' : 
                 language === 'hi' ? 'वार्तालाप समाप्त करें' : 
                 language === 'ar' ? 'إنهاء المحادثة' :
                 'End Conversation'}
              </button>
            </div>
            <div className="pb-8"></div> {/* Extra padding to ensure buttons are visible */}
          </div>
        </div>

        <div className="text-gray-300 space-y-4">
          <ul className="list-disc pl-6 space-y-2">
            {[
              { en: 'What are my rights if ICE comes to my door?',
                es: '¿Cuáles son mis derechos si ICE viene a mi puerta?',
                zh: '如果移民局来敲我的门，我有什么权利？',
                hi: 'अगर ICE मेरे दरवाजे पर आता है तो मेरे क्या अधिकार हैं?',
                ar: 'ما هي حقوقي إذا جاء ICE إلى بابي؟'
              },
              { en: 'Do I have to show identification to police?',
                es: '¿Tengo que mostrar identificación a la policía?',
                zh: '我必须向警察出示身份证明吗？',
                hi: 'क्या मुझे पुलिस को पहचान पत्र दिखाना होगा?',
                ar: 'هل يجب علي إظهار الهوية للشرطة؟'
              },
              { en: 'What is the difference between a warrant and an ICE order?',
                es: '¿Cuál es la diferencia entre una orden judicial y una orden de ICE?',
                zh: '法院搜查令和移民局命令有什么区别？',
                hi: 'वारंट और ICE आदेश के बीच क्या अंतर है?',
                ar: 'ما هو الفرق بين أمر التفتيش وأمر ICE؟'
              },
              { en: 'What should I do if I\'m detained?',
                es: '¿Qué debo hacer si soy detenido?',
                zh: '如果我被拘留了该怎么办？',
                hi: 'अगर मुझे हिरासत में लिया जाता है तो मुझे क्या करना चाहिए?',
                ar: 'ماذا يجب أن أفعل إذا تم احتجازي؟'
              }
            ].map((item, index) => {
              const text = language === 'hi' ? item.hi :
                          language === 'zh' ? item.zh : 
                          language === 'es' ? item.es : 
                          language === 'ar' ? item.ar :
                          item.en;
              return (
                <li key={index}>{text}</li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Lupe;