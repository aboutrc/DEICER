import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface SignupProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

const Signup: React.FC<SignupProps> = ({ language = 'en' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const translations = {
    en: {
      title: 'Create your account',
      emailLabel: 'Email address',
      emailPlaceholder: 'Enter your email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Create a password',
      confirmPasswordLabel: 'Confirm password',
      confirmPasswordPlaceholder: 'Confirm your password',
      signUpButton: 'Sign up',
      loading: 'Creating account...',
      haveAccount: 'Already have an account?',
      signIn: 'Sign in',
      passwordMismatch: 'Passwords do not match',
      weakPassword: 'Password must be at least 6 characters',
      emailInUse: 'Email already in use',
      genericError: 'An error occurred. Please try again.',
      successMessage: 'Account created successfully! You can now sign in.'
    },
    es: {
      title: 'Crea tu cuenta',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'Ingresa tu correo',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Crea una contraseña',
      confirmPasswordLabel: 'Confirmar contraseña',
      confirmPasswordPlaceholder: 'Confirma tu contraseña',
      signUpButton: 'Registrarse',
      loading: 'Creando cuenta...',
      haveAccount: '¿Ya tienes una cuenta?',
      signIn: 'Iniciar sesión',
      passwordMismatch: 'Las contraseñas no coinciden',
      weakPassword: 'La contraseña debe tener al menos 6 caracteres',
      emailInUse: 'El correo ya está en uso',
      genericError: 'Ocurrió un error. Por favor, inténtalo de nuevo.',
      successMessage: '¡Cuenta creada con éxito! Ahora puedes iniciar sesión.'
    },
    zh: {
      title: '创建您的账户',
      emailLabel: '电子邮箱',
      emailPlaceholder: '输入您的邮箱',
      passwordLabel: '密码',
      passwordPlaceholder: '创建密码',
      confirmPasswordLabel: '确认密码',
      confirmPasswordPlaceholder: '确认您的密码',
      signUpButton: '注册',
      loading: '创建账户中...',
      haveAccount: '已有账户？',
      signIn: '登录',
      passwordMismatch: '密码不匹配',
      weakPassword: '密码必须至少6个字符',
      emailInUse: '邮箱已被使用',
      genericError: '发生错误。请重试。',
      successMessage: '账户创建成功！您现在可以登录。'
    },
    hi: {
      title: 'अपना खाता बनाएं',
      emailLabel: 'ईमेल पता',
      emailPlaceholder: 'अपना ईमेल दर्ज करें',
      passwordLabel: 'पासवर्ड',
      passwordPlaceholder: 'एक पासवर्ड बनाएं',
      confirmPasswordLabel: 'पासवर्ड की पुष्टि करें',
      confirmPasswordPlaceholder: 'अपने पासवर्ड की पुष्टि करें',
      signUpButton: 'साइन अप करें',
      loading: 'खाता बनाया जा रहा है...',
      haveAccount: 'पहले से ही खाता है?',
      signIn: 'साइन इन करें',
      passwordMismatch: 'पासवर्ड मेल नहीं खाते',
      weakPassword: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए',
      emailInUse: 'ईमेल पहले से उपयोग में है',
      genericError: 'एक त्रुटि हुई। कृपया पुनः प्रयास करें।',
      successMessage: 'खाता सफलतापूर्वक बनाया गया! अब आप साइन इन कर सकते हैं।'
    },
    ar: {
      title: 'إنشاء حسابك',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'أدخل بريدك الإلكتروني',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: 'أنشئ كلمة مرور',
      confirmPasswordLabel: 'تأكيد كلمة المرور',
      confirmPasswordPlaceholder: 'أكد كلمة المرور',
      signUpButton: 'إنشاء حساب',
      loading: 'جاري إنشاء الحساب...',
      haveAccount: 'لديك حساب بالفعل؟',
      signIn: 'تسجيل الدخول',
      passwordMismatch: 'كلمات المرور غير متطابقة',
      weakPassword: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل',
      emailInUse: 'البريد الإلكتروني قيد الاستخدام بالفعل',
      genericError: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
      successMessage: 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.'
    }
  };

  const t = translations[language];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        setError(t.passwordMismatch);
        return;
      }
      
      // Validate password strength
      if (password.length < 6) {
        setError(t.weakPassword);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        
        if (error.message.includes('already registered')) {
          setError(t.emailInUse);
        } else {
          setError(t.genericError);
        }
        return;
      }
      
      // Redirect to login page on successful signup
      navigate('/login');
      
    } catch (err) {
      console.error('Unexpected signup error:', err);
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-900 flex items-center justify-center p-4 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">{t.title}</h2>
        
        {error && (
          <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              {t.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder={t.emailPlaceholder}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              {t.passwordLabel}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder={t.passwordPlaceholder}
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
              {t.confirmPasswordLabel}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder={t.confirmPasswordPlaceholder}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                {t.loading}
              </>
            ) : (
              t.signUpButton
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center text-gray-400">
          <span>{t.haveAccount}</span>{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            {t.signIn}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;