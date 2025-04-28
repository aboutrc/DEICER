import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Loader2, AlertTriangle } from 'lucide-react';

interface UserProfileProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

const UserProfile: React.FC<UserProfileProps> = ({ language = 'en' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const navigate = useNavigate();

  const translations = {
    en: {
      title: 'Your Profile',
      email: 'Email',
      signOut: 'Sign Out',
      loading: 'Loading...',
      error: 'An error occurred. Please try again.',
      donationHistory: 'Donation History',
      noDonations: 'No donations yet',
      donationDate: 'Date',
      donationAmount: 'Amount',
      donationStatus: 'Status',
      backToHome: 'Back to Home'
    },
    es: {
      title: 'Tu Perfil',
      email: 'Correo',
      signOut: 'Cerrar Sesión',
      loading: 'Cargando...',
      error: 'Ocurrió un error. Por favor, inténtalo de nuevo.',
      donationHistory: 'Historial de Donaciones',
      noDonations: 'Aún no hay donaciones',
      donationDate: 'Fecha',
      donationAmount: 'Cantidad',
      donationStatus: 'Estado',
      backToHome: 'Volver al Inicio'
    },
    zh: {
      title: '您的个人资料',
      email: '电子邮箱',
      signOut: '退出登录',
      loading: '加载中...',
      error: '发生错误。请重试。',
      donationHistory: '捐赠历史',
      noDonations: '暂无捐赠',
      donationDate: '日期',
      donationAmount: '金额',
      donationStatus: '状态',
      backToHome: '返回首页'
    },
    hi: {
      title: 'आपका प्रोफ़ाइल',
      email: 'ईमेल',
      signOut: 'साइन आउट',
      loading: 'लोड हो रहा है...',
      error: 'एक त्रुटि हुई। कृपया पुनः प्रयास करें।',
      donationHistory: 'दान इतिहास',
      noDonations: 'अभी तक कोई दान नहीं',
      donationDate: 'तारीख',
      donationAmount: 'राशि',
      donationStatus: 'स्थिति',
      backToHome: 'होम पेज पर वापस जाएं'
    },
    ar: {
      title: 'ملفك الشخصي',
      email: 'البريد الإلكتروني',
      signOut: 'تسجيل الخروج',
      loading: 'جاري التحميل...',
      error: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
      donationHistory: 'سجل التبرعات',
      noDonations: 'لا توجد تبرعات حتى الآن',
      donationDate: 'التاريخ',
      donationAmount: 'المبلغ',
      donationStatus: 'الحالة',
      backToHome: 'العودة إلى الصفحة الرئيسية'
    }
  };

  const t = translations[language];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }
        
        setUser(session.user);
        
        // Fetch donation history
        const { data: orders, error: ordersError } = await supabase
          .from('stripe_user_orders')
          .select('*')
          .order('order_date', { ascending: false });
        
        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          throw new Error('Failed to fetch donation history');
        }
        
        setDonations(orders || []);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(t.error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate, t.error]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
      setError(t.error);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
          <p className="text-gray-300">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-900 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {error && (
          <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl border border-gray-800 mb-8">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">{t.title}</h1>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center"
              >
                <LogOut size={18} className="mr-2" />
                {t.signOut}
              </button>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">{user?.email}</h2>
                  <p className="text-gray-400 text-sm">{t.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl border border-gray-800">
          <div className="p-8">
            <h2 className="text-xl font-bold text-white mb-6">{t.donationHistory}</h2>
            
            {donations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-800/70 text-gray-300">
                    <tr>
                      <th className="px-6 py-3 rounded-tl-lg">{t.donationDate}</th>
                      <th className="px-6 py-3">{t.donationAmount}</th>
                      <th className="px-6 py-3 rounded-tr-lg">{t.donationStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {donations.map((donation) => (
                      <tr key={donation.order_id} className="text-gray-300">
                        <td className="px-6 py-4">
                          {new Date(donation.order_date).toLocaleDateString(
                            language === 'es' ? 'es-ES' :
                            language === 'zh' ? 'zh-CN' :
                            language === 'hi' ? 'hi-IN' :
                            language === 'ar' ? 'ar-SA' :
                            'en-US'
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {formatCurrency(donation.amount_total, donation.currency)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            donation.payment_status === 'paid' ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'
                          }`}>
                            {donation.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                {t.noDonations}
              </div>
            )}
            
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {t.backToHome}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;