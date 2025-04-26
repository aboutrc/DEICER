import React from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';

interface AuthProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

const Auth: React.FC<AuthProps> = ({ language = 'en' }) => {
  const translations = {
    en: {
      sign_in: 'Sign In',
      sign_up: 'Sign Up',
      email: 'Email',
      password: 'Password',
      forgot_password: 'Forgot Password?',
      magic_link: 'Send Magic Link',
      loading: 'Loading...',
      email_input_placeholder: 'Your email address',
      password_input_placeholder: 'Your password',
      confirmation_text: "We've sent you an email with a link to reset your password.",
    },
    es: {
      sign_in: 'Iniciar Sesión',
      sign_up: 'Registrarse',
      email: 'Correo',
      password: 'Contraseña',
      forgot_password: '¿Olvidaste tu contraseña?',
      magic_link: 'Enviar enlace mágico',
      loading: 'Cargando...',
      email_input_placeholder: 'Tu correo electrónico',
      password_input_placeholder: 'Tu contraseña',
      confirmation_text: 'Te hemos enviado un correo con un enlace para restablecer tu contraseña.',
    },
    zh: {
      sign_in: '登录',
      sign_up: '注册',
      email: '邮箱',
      password: '密码',
      forgot_password: '忘记密码？',
      magic_link: '发送魔法链接',
      loading: '加载中...',
      email_input_placeholder: '你的邮箱地址',
      password_input_placeholder: '你的密码',
      confirmation_text: '我们已经发送了一封包含重置密码链接的邮件给你。',
    },
    hi: {
      sign_in: 'साइन इन',
      sign_up: 'साइन अप',
      email: 'ईमेल',
      password: 'पासवर्ड',
      forgot_password: 'पासवर्ड भूल गए?',
      magic_link: 'मैजिक लिंक भेजें',
      loading: 'लोड हो रहा है...',
      email_input_placeholder: 'आपका ईमेल पता',
      password_input_placeholder: 'आपका पासवर्ड',
      confirmation_text: 'हमने आपको पासवर्ड रीसेट लिंक के साथ एक ईमेल भेजा है।',
    },
    ar: {
      sign_in: 'تسجيل الدخول',
      sign_up: 'إنشاء حساب',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      forgot_password: 'نسيت كلمة المرور؟',
      magic_link: 'إرسال رابط سحري',
      loading: 'جار التحميل...',
      email_input_placeholder: 'عنوان بريدك الإلكتروني',
      password_input_placeholder: 'كلمة المرور الخاصة بك',
      confirmation_text: 'لقد أرسلنا لك بريدًا إلكترونيًا يحتوي على رابط لإعادة تعيين كلمة المرور.',
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8">
        <SupabaseAuth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#3b82f6',
                  brandAccent: '#2563eb',
                  brandButtonText: 'white',
                  defaultButtonBackground: '#1f2937',
                  defaultButtonBackgroundHover: '#374151',
                  inputBackground: '#1f2937',
                  inputBorder: '#374151',
                  inputBorderHover: '#4b5563',
                  inputBorderFocus: '#3b82f6',
                  inputText: 'white',
                  inputPlaceholder: '#9ca3af',
                }
              }
            },
            className: {
              container: 'auth-container',
              label: 'text-gray-300 font-medium',
              button: 'rounded-lg font-medium',
              input: 'rounded-lg',
              message: 'text-gray-400'
            }
          }}
          localization={{
            variables: translations[language]
          }}
          providers={[]}
        />
      </div>
    </div>
  );
};

export default Auth;