import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface LoginProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

const Login: React.FC<LoginProps> = ({ language = 'en' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const translations = {
    en: {
      title: 'Sign in to your account',
      emailLabel: 'Email address',
      emailPlaceholder: 'Enter your email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      signInButton: 'Sign in',
      loading: 'Signing in...',
      noAccount: "Don't have an account?",
      signUp: 'Sign up',
      invalidCredentials: 'Invalid email or password',
      genericError: 'An error occurred. Please try again.'
    },
    es: {
      title: 'Inicia sesión en tu cuenta',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'Ingresa tu correo',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Ingresa tu contraseña',
      signInButton: 'Iniciar sesión',
      loading: 'Iniciando sesión...',
      noAccount: '¿No tienes una cuenta?',
      signUp: 'Regístrate',
      invalidCredentials: 'Correo o contraseña inválidos',
      genericError: 'Ocurrió un error. Por favor, inténtalo de nuevo.'
    },
    zh: {
      title: '登录您的账户',
      emailLabel: '电子邮箱',
      emailPlaceholder: '输入您的邮箱',
      passwordLabel: '密码',
      passwordPlaceholder: '输入您的密码',
      signInButton: '登录',
      loading: '登录中...',
      noAccount: '没有账户？',
      signUp: '注册',
      invalidCredentials: '邮箱或密码无效',
      genericError: '发生错误。请重试。'
    },
    hi: {
      title: 'अपने खाते में साइन इन करें',
      emailLabel: 'ईमेल पता',
      emailPlaceholder: 'अपना ईमेल दर्ज करें',
      passwordLabel: 'पासवर्ड',
      passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
      signInButton: 'साइन इन करें',
      loading: 'साइन इन हो रहा है...',
      noAccount: 'खाता नहीं है?',
      signUp: 'साइन अप करें',
      invalidCredentials: 'अमान्य ईमेल या पासवर्ड',
      genericError: 'एक त्रुटि हुई। कृपया पुनः प्रयास करें।'
    },
    ar: {
      title: 'تسجيل الدخول إلى حسابك',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'أدخل بريدك الإلكتروني',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: 'أدخل كلمة المرور',
      signInButton: 'تسجيل الدخول',
      loading: 'جاري تسجيل الدخول...',
      noAccount: 'ليس لديك حساب؟',
      signUp: 'إنشاء حساب',
      invalidCredentials: 'بريد إلكتروني أو كلمة مرور غير صالحة',
      genericError: 'حدث خطأ. يرجى المحاولة مرة أخرى.'
    }
  };

  const t = translations[language];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error:', error);
        setError(error.message === 'Invalid login credentials' 
          ? t.invalidCredentials 
          : t.genericError);
        return;
      }
      
      // Redirect to home page on successful login
      navigate('/');
      
    } catch (err) {
      console.error('Unexpected login error:', err);
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
        
        <form onSubmit={handleLogin} className="space-y-6">
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
              t.signInButton
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center text-gray-400">
          <span>{t.noAccount}</span>{' '}
          <Link to="/signup" className="text-blue-400 hover:text-blue-300">
            {t.signUp}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;