import React, { useState } from 'react';
import { GraduationCap, Search, X } from 'lucide-react';
import { universities, University } from '../lib/universities';
import { translations } from '../translations';

interface UniversitySelectorProps {
  onSelect: (university: University) => void;
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
  className?: string;
}

const UniversitySelector: React.FC<UniversitySelectorProps> = ({ onSelect, language = 'en', className = '' }) => {
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

  return (
    <div className={`relative z-[1003] self-center ${className}`}>
      <button
        onClick={() => setShowLightbox(true)}
        className="relative w-full px-4 py-2 bg-black/90 backdrop-blur-sm text-white rounded-lg shadow-lg flex items-center justify-center hover:bg-black/80 transition-colors border border-gray-700/50"
      >
        <GraduationCap size={20} className="mr-2" />
        <span>
          {language === 'es' ? 'Universidad' : 
           language === 'zh' ? '大学' : 
           language === 'hi' ? 'विश्वविद्यालय' : 
           language === 'ar' ? 'جامعة' : 
           'University'}
        </span>
      </button>

      {/* Lightbox University Selector */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1100] flex items-center justify-center p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowLightbox(false);
          }
        }}>
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center">
                <GraduationCap className="mr-2" size={24} />
                {language === 'es' ? 'Seleccionar Universidad' :
                 language === 'zh' ? '选择大学' :
                 language === 'hi' ? 'विश्वविद्यालय चुनें' :
                 language === 'ar' ? 'اختر الجامعة' :
                 'Select University'}
              </h2>
              <button 
                onClick={() => setShowLightbox(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-700">
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

            <div className="overflow-y-auto flex-1 p-2">
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
                  <div className="text-center py-8 text-gray-400">
                    {language === 'es' ? 'No se encontraron universidades' :
                     language === 'zh' ? '未找到大学' :
                     language === 'hi' ? 'कोई विश्वविद्यालय नहीं मिला' :
                     language === 'ar' ? 'لم يتم العثور على جامعات' :
                     'No universities found'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UniversitySelector;