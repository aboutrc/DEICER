import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Map, CreditCard, Shield, Scale, User } from 'lucide-react';
import type { University } from '../lib/universities';
import Footer from './Footer';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  language: 'en' | 'es' | 'zh' | 'hi' | 'ar';
  onLanguageChange: (language: 'en' | 'es' | 'zh' | 'hi' | 'ar') => void;
  onUniversitySelect?: (university: University) => void;
}

const menuItems = [
  { icon: Map, label: { en: 'Map', es: 'Mapa', zh: '地图', hi: 'मानचित्र', ar: 'خريطة' }, path: '/' },
  { icon: CreditCard, label: { en: 'Card', es: 'Tarjeta', zh: '卡片', hi: 'कार्ड', ar: 'بطاقة' }, path: '/card' },
  { icon: Shield, label: { en: 'Protect', es: 'Proteger', zh: '保护', hi: 'सुरक्षा', ar: 'حماية' }, path: '/protect' },
  { icon: Scale, label: { en: 'Info', es: 'Info', zh: '信息', hi: 'जानकारी', ar: 'معلومات' }, path: '/info' },
  { icon: User, label: { en: 'Chat', es: 'Chat', zh: '聊天', hi: 'चैट', ar: 'دردشة' }, path: '/lupe' }
];

// Flag images for language selection
const languageFlags = {
  en: { flag: "https://flagcdn.com/w40/us.png", name: "EN" },
  es: { flag: "https://flagcdn.com/w40/mx.png", name: "ES" },
  zh: { flag: "https://flagcdn.com/w40/cn.png", name: "ZH" },
  hi: { flag: "https://flagcdn.com/w40/in.png", name: "HI" },
  ar: { flag: "https://flagcdn.com/w40/sa.png", name: "AR" }
};

// Define the order of languages for cycling
const languageOrder: ('en' | 'es' | 'zh' | 'hi' | 'ar')[] = ['en', 'es', 'zh', 'hi', 'ar'];

const Layout: React.FC<LayoutProps> = ({ children, language, onLanguageChange, onUniversitySelect }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  React.useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLanguageToggle = () => {
    // Find current language index
    const currentIndex = languageOrder.indexOf(language);
    const nextLanguage = languageOrder[(currentIndex + 1) % languageOrder.length];
    onLanguageChange(nextLanguage);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gray-900">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black text-white py-5 px-6 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-4 flex-1 h-full">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src="/deicerlogo.png" alt="DEICER" className="h-8 md:h-12" />
          </Link>
        </div>
        
        {/* Language toggle button moved to far right */}
        <button
          onClick={handleLanguageToggle}
          className="flex items-center bg-black/30 px-2 py-1 rounded-lg hover:bg-black/50 transition-colors"
        >
          <span className="mr-2 font-medium text-sm">{languageFlags[language].name}</span>
          <img 
            src={languageFlags[language].flag} 
            alt={language.toUpperCase()} 
            className="w-6 h-4 object-cover rounded"
          />
        </button>
      </header>

      {/* Navigation Menu */}
      <nav className="fixed top-[calc(4rem+5px)] md:top-[calc(5.5rem+5px)] left-0 right-0 z-40 bg-black text-white nav-menu">
        <div className="grid grid-cols-5 divide-x divide-gray-800">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-3 h-full transition-colors nav-menu-item ${
                location.pathname === item.path ? 'bg-gray-800' : 'hover:bg-gray-900'
              }`}
            >
              <item.icon size={20} className="nav-menu-item-icon" />
              <span className="nav-menu-item-text">{item.label[language]}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pt-[6.5rem] md:pt-[10.5rem] pb-16">
        {children}
      </main>

      {/* Footer */}
      <Footer language={language} className="fixed bottom-0 left-0 right-0 z-40 bg-black" />
    </div>
  );
};

export default Layout;