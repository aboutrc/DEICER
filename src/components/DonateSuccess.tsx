import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';

interface DonateSuccessProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

const DonateSuccess: React.FC<DonateSuccessProps> = ({ language = 'en' }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  const translations = {
    en: {
      title: 'Thank You for Your Donation!',
      subtitle: 'Your support helps us continue our mission to protect immigrant rights.',
      message: 'Your donation has been successfully processed.',
      sessionId: 'Session ID:',
      redirectMessage: 'You will be redirected to the home page in',
      seconds: 'seconds',
      backToHome: 'Back to Home',
    },
    es: {
      title: '¡Gracias por tu Donación!',
      subtitle: 'Tu apoyo nos ayuda a continuar nuestra misión de proteger los derechos de los inmigrantes.',
      message: 'Tu donación ha sido procesada con éxito.',
      sessionId: 'ID de Sesión:',
      redirectMessage: 'Serás redirigido a la página principal en',
      seconds: 'segundos',
      backToHome: 'Volver al Inicio',
    },
    zh: {
      title: '感谢您的捐赠！',
      subtitle: '您的支持帮助我们继续我们保护移民权利的使命。',
      message: '您的捐赠已成功处理。',
      sessionId: '会话ID：',
      redirectMessage: '您将在以下时间内重定向到主页',
      seconds: '秒',
      backToHome: '返回首页',
    },
    hi: {
      title: 'आपके दान के लिए धन्यवाद!',
      subtitle: 'आपका समर्थन हमें प्रवासी अधिकारों की रक्षा के अपने मिशन को जारी रखने में मदद करता है।',
      message: 'आपका दान सफलतापूर्वक प्रोसेस किया गया है।',
      sessionId: 'सेशन आईडी:',
      redirectMessage: 'आप होम पेज पर रीडायरेक्ट किए जाएंगे',
      seconds: 'सेकंड में',
      backToHome: 'होम पेज पर वापस जाएं',
    },
    ar: {
      title: 'شكراً لتبرعك!',
      subtitle: 'دعمك يساعدنا على مواصلة مهمتنا في حماية حقوق المهاجرين.',
      message: 'تمت معالجة تبرعك بنجاح.',
      sessionId: 'معرف الجلسة:',
      redirectMessage: 'ستتم إعادة توجيهك إلى الصفحة الرئيسية في',
      seconds: 'ثوانٍ',
      backToHome: 'العودة إلى الصفحة الرئيسية',
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate('/');
    }
  }, [countdown, navigate]);

  return (
    <div className={`min-h-screen bg-gray-900 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl border border-gray-800">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle size={40} className="text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">{t.title}</h1>
            <p className="text-gray-300 text-lg mb-6">{t.subtitle}</p>
            
            <div className="bg-gray-800/50 rounded-lg p-6 mb-8 inline-block">
              <p className="text-gray-300">{t.message}</p>
              {sessionId && (
                <p className="text-gray-400 mt-2 text-sm">
                  {t.sessionId} <span className="font-mono">{sessionId}</span>
                </p>
              )}
            </div>
            
            <p className="text-gray-400 mb-6">
              {t.redirectMessage} <span className="font-bold text-white">{countdown}</span> {t.seconds}
            </p>
            
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center"
            >
              <ArrowLeft size={18} className="mr-2" />
              {t.backToHome}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonateSuccess;