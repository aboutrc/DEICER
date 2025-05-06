import React, { useState, useEffect } from 'react';
import { GraduationCap, Search, X } from 'lucide-react';
import { universities, University } from '../lib/universities';
import { translations } from '../translations';
import Modal from './Modal'; 

interface UniversitySelectorProps {
  onSelect: (university: University) => void;
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
  className?: string;
  id?: string;
}

const UniversitySelector: React.FC<UniversitySelectorProps> = ({ onSelect, language = 'en', className = '', id }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const t = translations[language];

  const filteredUniversities = universities.filter(uni =>
    uni.university.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUniversitySelect = (university: University) => {
    if (onSelect) {
      onSelect(university);
    }
    setShowLightbox(false);
    setSearchTerm('');
  };

  // ESC key listener to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowLightbox(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return (
    <div className={`relative z-[1003] self-center ${className}`}>
      <button
        id={id}
        onClick={() => setShowLightbox(true)} 
        className="w-full px-3 py-2 bg-gray-800/90 backdrop-blur-sm text-gray-100 rounded-lg shadow-md flex items-center hover:bg-gray-700 transition-colors"
      >
        <GraduationCap size={20} className="mr-2" />
        <span className="flex-1 text-left">
          {language === 'es' ? 'Universidad' : 
           language === 'zh' ? '大学' : 
           language === 'hi' ? 'विश्वविद्यालय' : 
           language === 'ar' ? 'جامعة' : 
           'University'}
        </span>
      </button>

      <Modal 
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
        title={
          <span className="flex flex-col items-center text-center">
            <GraduationCap className="mr-2" size={24} />
            <div>
              {language === 'es' ? 'Universidades en' :
               language === 'zh' ? '互助学术防御协议的' :
               language === 'hi' ? 'पारस्परिक शैक्षणिक रक्षा समझौतों में' :
               language === 'ar' ? 'الجامعات في' :
               'Universities in'}
            </div>
            <div>
              {language === 'es' ? 'Pactos de Defensa Académica Mutua' :
               language === 'zh' ? '大学' :
               language === 'hi' ? 'शामिल विश्वविद्यालय' :
               language === 'ar' ? 'اتفاقيات الدفاع الأكاديمي المتبادل' :
              'Mutual Academic Defense Compacts (MDAC)'}
            </div>
          </span>
        }
      >
        {/* Search Box */}
        <div className="p-4 border-b border-gray-700 bg-gray-900">
          <div className="relative w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                language === 'es' ? 'Buscar universidad...' :
                language === 'zh' ? '搜索大学...' :
                language === 'hi' ? 'विश्वविद्यालय खोजें...' :
                language === 'ar' ? 'البحث عن الجامعة...' :
                'Search university...'
              }
              className="w-full px-4 py-3 pr-10 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 placeholder-gray-500"
              autoFocus
            />
            <Search size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        {/* University List */}
        <div className="p-2 bg-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredUniversities.map((uni) => (
              <button
                key={uni.university}
                onClick={() => handleUniversitySelect(uni)}
                className="w-full px-4 py-3 text-left text-white bg-gray-800/50 hover:bg-gray-700/70 rounded-lg transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <GraduationCap size={18} className="text-blue-400 flex-shrink-0" />
                <span className="line-clamp-2">{uni.university}</span>
              </button>
            ))}
            
            {filteredUniversities.length === 0 && (
              <div className="text-center py-8 text-gray-400 col-span-2">
                {language === 'es' ? 'No se encontraron universidades' :
                 language === 'zh' ? '未找到大学' :
                 language === 'hi' ? 'कोई विश्वविद्यालय नहीं मिला' :
                 language === 'ar' ? 'لم يتم العثور على جامعات' :
                 'No universities found'}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UniversitySelector;
