import React, { useEffect } from 'react';
import { translations } from '../translations';
import { Coffee } from 'lucide-react';

interface FooterProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
  className?: string;
}

const Footer = ({ language, className = '' }: FooterProps) => {
  const t = translations[language || 'en'];

  return (
    <footer className={`bg-[#000E54]/90 backdrop-blur-sm border-t border-gray-800 ${className} ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div className="animate-scroll inline-block">
            <p className="text-gray-300 text-sm">
              <span dangerouslySetInnerHTML={{ __html: t.footer?.message || translations.en.footer.message }} />
              {' '}If you want to support the project, share with any investors to fund. If you still want to support{' '}
              <a 
                href="http://buymeacoffee.com/aboutrc" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-yellow-400 hover:text-yellow-300 inline-flex items-center"
              >
                <Coffee size={16} className="mr-1" />
                Buy Me a Coffee
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;