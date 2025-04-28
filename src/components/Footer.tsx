import React, { useEffect } from 'react';
import { translations } from '../translations';
import { Coffee, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
  className?: string;
}

const Footer = ({ language, className = '' }: FooterProps) => {
  const t = translations[language || 'en'];

  return (
    <footer className={`backdrop-blur-sm border-t border-gray-800 ${className} ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 overflow-hidden whitespace-nowrap min-w-0">
          <div className="animate-scroll inline-block">
            <p className="text-gray-300 text-sm">
              <span dangerouslySetInnerHTML={{ __html: t.footer?.message || translations.en.footer.message }} />
              {' '}If you would like to support this effort, share with any investors for funding, or click on the Donate button. It is NOT required, but appreciated.
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Link 
            to="/donate" 
            className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Heart size={16} className="mr-1.5" />
            {language === 'es' ? 'Donar' : 
             language === 'zh' ? '捐赠' : 
             language === 'hi' ? 'दान करें' : 
             language === 'ar' ? 'تبرع' : 
             'Donate'}
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;