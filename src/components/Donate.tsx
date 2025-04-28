import React, { useState } from 'react';
import { products } from '../stripe-config';
import { useNavigate } from 'react-router-dom';
import { Loader2, CreditCard, Mail } from 'lucide-react';

interface DonateProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

const Donate: React.FC<DonateProps> = ({ language = 'en' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(10);
  const [email, setEmail] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvc, setCardCvc] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  const translations = {
    en: {
      title: 'Donate',
      donateButton: 'Donate',
      donateNow: 'Donate Now',
      loading: 'Processing...',
      error: 'An error occurred. Please try again.',
      loginRequired: 'Please log in to donate',
      loginButton: 'Log In',
      signupButton: 'Sign Up',
      thankYou: 'Thank you for your support!',
      benefits: 'Your donation helps us:',
      benefit1: 'Keep the service free for everyone',
      benefit2: 'Improve and add new features',
      benefit3: 'Expand to more languages and regions',
      benefit4: 'Maintain our servers and infrastructure',
      cardDetails: 'Card Details',
      cardNumber: 'Card Number',
      cardNumberPlaceholder: '1234 5678 9012 3456',
      cardExpiry: 'Expiration Date',
      cardExpiryPlaceholder: 'MM/YY',
      cardCvc: 'CVC',
      cardCvcPlaceholder: '123',
      amount: 'Donation Amount',
      emailLabel: 'Email (optional)',
      emailPlaceholder: 'For donation receipt (optional)',
      customAmount: 'Custom Amount',
      successMessage: 'Thank you for your donation!',
      successDetails: 'Your support helps us continue our mission.',
      backToHome: 'Back to Home'
    },
    es: {
      title: 'Donar',
      donateButton: 'Donar',
      donateNow: 'Donar Ahora',
      loading: 'Procesando...',
      error: 'Ocurrió un error. Por favor, inténtalo de nuevo.',
      loginRequired: 'Por favor, inicia sesión para donar',
      loginButton: 'Iniciar Sesión',
      signupButton: 'Registrarse',
      thankYou: '¡Gracias por tu apoyo!',
      benefits: 'Tu donación nos ayuda a:',
      benefit1: 'Mantener el servicio gratuito para todos',
      benefit2: 'Mejorar y añadir nuevas funciones',
      benefit3: 'Expandirnos a más idiomas y regiones',
      benefit4: 'Mantener nuestros servidores e infraestructura',
      cardDetails: 'Detalles de la Tarjeta',
      cardNumber: 'Número de Tarjeta',
      cardNumberPlaceholder: '1234 5678 9012 3456',
      cardExpiry: 'Fecha de Expiración',
      cardExpiryPlaceholder: 'MM/AA',
      cardCvc: 'CVC',
      cardCvcPlaceholder: '123',
      amount: 'Monto de Donación',
      emailLabel: 'Correo (opcional)',
      emailPlaceholder: 'Para recibo de donación (opcional)',
      customAmount: 'Monto Personalizado',
      successMessage: '¡Gracias por tu donación!',
      successDetails: 'Tu apoyo nos ayuda a continuar nuestra misión.',
      backToHome: 'Volver al Inicio'
    },
    zh: {
      title: '捐赠',
      donateButton: '捐赠',
      donateNow: '立即捐赠',
      loading: '处理中...',
      error: '发生错误。请重试。',
      loginRequired: '请登录后捐赠',
      loginButton: '登录',
      signupButton: '注册',
      thankYou: '感谢您的支持！',
      benefits: '您的捐款帮助我们：',
      benefit1: '保持服务对所有人免费',
      benefit2: '改进并添加新功能',
      benefit3: '扩展到更多语言和地区',
      benefit4: '维护我们的服务器和基础设施',
      cardDetails: '卡片详情',
      cardNumber: '卡号',
      cardNumberPlaceholder: '1234 5678 9012 3456',
      cardExpiry: '有效期',
      cardExpiryPlaceholder: 'MM/YY',
      cardCvc: '安全码',
      cardCvcPlaceholder: '123',
      amount: '捐赠金额',
      emailLabel: '邮箱（可选）',
      emailPlaceholder: '用于捐赠收据（可选）',
      customAmount: '自定义金额',
      successMessage: '感谢您的捐赠！',
      successDetails: '您的支持帮助我们继续我们的使命。',
      backToHome: '返回首页'
    },
    hi: {
      title: 'दान करें',
      donateButton: 'दान करें',
      donateNow: 'अभी दान करें',
      loading: 'प्रोसेसिंग...',
      error: 'एक त्रुटि हुई। कृपया पुनः प्रयास करें।',
      loginRequired: 'दान करने के लिए कृपया लॉग इन करें',
      loginButton: 'लॉग इन',
      signupButton: 'साइन अप',
      thankYou: 'आपके समर्थन के लिए धन्यवाद!',
      benefits: 'आपका दान हमें मदद करता है:',
      benefit1: 'सेवा को सभी के लिए मुफ्त रखने में',
      benefit2: 'सुधार करने और नई सुविधाएँ जोड़ने में',
      benefit3: 'अधिक भाषाओं और क्षेत्रों में विस्तार करने में',
      benefit4: 'हमारे सर्वर और बुनियादी ढांचे को बनाए रखने में',
      cardDetails: 'कार्ड विवरण',
      cardNumber: 'कार्ड नंबर',
      cardNumberPlaceholder: '1234 5678 9012 3456',
      cardExpiry: 'समाप्ति तिथि',
      cardExpiryPlaceholder: 'MM/YY',
      cardCvc: 'CVC',
      cardCvcPlaceholder: '123',
      amount: 'दान राशि',
      emailLabel: 'ईमेल (वैकल्पिक)',
      emailPlaceholder: 'दान रसीद के लिए (वैकल्पिक)',
      customAmount: 'कस्टम राशि',
      successMessage: 'आपके दान के लिए धन्यवाद!',
      successDetails: 'आपका समर्थन हमें अपने मिशन को जारी रखने में मदद करता है।',
      backToHome: 'होम पेज पर वापस जाएं'
    },
    ar: {
      title: 'تبرع',
      donateButton: 'تبرع',
      donateNow: 'تبرع الآن',
      loading: 'جاري المعالجة...',
      error: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
      loginRequired: 'يرجى تسجيل الدخول للتبرع',
      loginButton: 'تسجيل الدخول',
      signupButton: 'إنشاء حساب',
      thankYou: 'شكرًا لدعمك!',
      benefits: 'تبرعك يساعدنا في:',
      benefit1: 'الحفاظ على الخدمة مجانية للجميع',
      benefit2: 'تحسين وإضافة ميزات جديدة',
      benefit3: 'التوسع إلى المزيد من اللغات والمناطق',
      benefit4: 'صيانة خوادمنا وبنيتنا التحتية',
      cardDetails: 'تفاصيل البطاقة',
      cardNumber: 'رقم البطاقة',
      cardNumberPlaceholder: '1234 5678 9012 3456',
      cardExpiry: 'تاريخ الانتهاء',
      cardExpiryPlaceholder: 'MM/YY',
      cardCvc: 'رمز التحقق',
      cardCvcPlaceholder: '123',
      amount: 'مبلغ التبرع',
      emailLabel: 'البريد الإلكتروني (اختياري)',
      emailPlaceholder: 'لإيصال التبرع (اختياري)',
      customAmount: 'مبلغ مخصص',
      successMessage: 'شكرًا لتبرعك!',
      successDetails: 'دعمك يساعدنا على مواصلة مهمتنا.',
      backToHome: 'العودة إلى الصفحة الرئيسية'
    }
  };

  const t = translations[language];
  const product = products[0]; // DEICER Donation

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setAmount(value);
    }
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Add space after every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const formatExpiry = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as MM/YY
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    
    return digits;
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardExpiry(formatExpiry(e.target.value));
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 4 characters (some cards have 4-digit CVC)
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvc(value);
  };

  const handleDonate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setSuccess(true);
      
      // Clear form
      setCardNumber('');
      setCardExpiry('');
      setCardCvc('');
      
    } catch (err) {
      console.error('Donation error:', err);
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const predefinedAmounts = [5, 10, 25, 50, 100];

  return (
    <div className={`min-h-screen bg-gray-900 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl border border-gray-800">
          <div className="p-8">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">{t.successMessage}</h2>
                <p className="text-gray-300 mb-8">{t.successDetails}</p>
                <button
                  onClick={handleBackToHome}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {t.backToHome}
                </button>
              </div>
            ) : (
              <>
                <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-white">{product.name}</h3>
                      <p className="text-gray-300 mt-1">
                        {language === 'es' ? 'Donación para apoyar el desarrollo del sitio DEICER y otras herramientas para ayudar a las personas bajo ataque en esta administración.' : 
                         language === 'zh' ? '捐款支持DEICER网站的开发以及其他工具，以帮助在这届政府中受到攻击的个人。' : 
                         language === 'hi' ? 'DEICER साइट के विकास और इस प्रशासन में हमले के तहत व्यक्तियों की मदद के लिए अन्य उपकरणों का समर्थन करने के लिए दान।' : 
                         language === 'ar' ? 'تبرع لدعم تطوير موقع DEICER وكذلك أدوات أخرى لمساعدة الأفراد الذين يتعرضون للهجوم في هذه الإدارة.' : 
                         product.description}
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg mb-4">
                      {error}
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-white font-medium mb-2">{t.amount}</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                      {predefinedAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAmount(amt)}
                          className={`py-2 px-4 rounded-lg font-medium ${
                            amount === amt
                              ? 'bg-yellow-500 text-black'
                              : 'bg-gray-700 text-white hover:bg-gray-600'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={handleAmountChange}
                        min="1"
                        step="1"
                        className="w-full pl-8 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                        placeholder={t.customAmount}
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-white font-medium mb-2">{t.emailLabel}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                        placeholder={t.emailPlaceholder}
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-white font-medium mb-2">{t.cardDetails}</h4>
                    <div className="space-y-4">
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                          placeholder={t.cardNumberPlaceholder}
                          maxLength={19}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                          placeholder={t.cardExpiryPlaceholder}
                          maxLength={5}
                        />
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={handleCvcChange}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                          placeholder={t.cardCvcPlaceholder}
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleDonate}
                    disabled={isLoading || !cardNumber || !cardExpiry || !cardCvc}
                    className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin mr-2" />
                        {t.loading}
                      </>
                    ) : (
                      t.donateNow
                    )}
                  </button>
                </div>

                <div className="text-gray-300">
                  <h3 className="text-xl font-semibold text-white mb-4">{t.benefits}</h3>                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <span className="text-yellow-400 mr-2">•</span>
                      <span>{t.benefit1}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-yellow-400 mr-2">•</span>
                      <span>{t.benefit2}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-yellow-400 mr-2">•</span>
                      <span>{t.benefit3}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-yellow-400 mr-2">•</span>
                      <span>{t.benefit4}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donate;