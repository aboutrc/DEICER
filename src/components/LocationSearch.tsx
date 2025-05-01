import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { translations } from '../translations';
import Modal from './Modal';

interface LocationSearchProps {
  onLocationSelect: (lat: number, lng: number) => void;
  language?: 'en' | 'es' | 'zh';
  className?: string;
  id?: string;
}

interface SearchResult {
  lat: number;
  lon: number;
  display_name: string;
}

export default function LocationSearch({ onLocationSelect, language = 'en', className = '', id }: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations[language];

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=5`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data);
      // Only open modal if we have results
      if (data.length > 0) {
        openModal();
      } else {
        setError(language === 'es' ? 'No se encontraron resultados' : 
                language === 'zh' ? '未找到结果' : 'No results found');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(t.errors.location);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    onLocationSelect(Number(result.lat), Number(result.lon));
    setSearchTerm('');
    setResults([]);
    closeModal();
  };

  return (
    <div className={`relative ${className}`}>
      <button
        id={id}
        onClick={() => openModal()}
        className="w-full px-3 py-2 bg-gray-800/90 backdrop-blur-sm text-gray-100 rounded-lg shadow-md flex items-center hover:bg-gray-700 transition-colors"
      >
        <Search size={20} className="mr-2" />
        <span className="flex-1 text-left">
          {language === 'es' ? 'Buscar' : 
           language === 'zh' ? '搜索' : 
           language === 'hi' ? 'खोज' : 
           language === 'ar' ? 'بحث' : 
           'Search'}
        </span>
      </button>

      {error && (
        <div className="absolute top-full mt-2 w-full">
          <div className="bg-red-900/90 backdrop-blur-sm text-red-100 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        </div>
      )}

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title={
          <span className="flex items-center">
            <MapPin className="mr-2" size={24} />
            {language === 'es' ? 'Buscar Ubicación' : 
             language === 'zh' ? '搜索位置' : 
             language === 'hi' ? 'स्थान खोजें' : 
             language === 'ar' ? 'البحث عن موقع' : 
             'Search Location'}
          </span>
        }
      >
        {/* Search Box */}
        <div className="p-4 border-b border-gray-700 bg-gray-900">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'es' ? 'Buscar ubicación...' : 
                          language === 'zh' ? '搜索位置...' : 'Search location...'}
              className="w-full px-4 py-3 pr-10 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 placeholder-gray-500"
              autoFocus
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Search size={20} />
              )}
            </button>
          </form>
          
          {error && (
            <div className="mt-2 bg-red-900/50 text-red-100 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
        
        {/* Results List */}
        <div className="p-2 bg-gray-900">
          {results.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(result)}
                  className="w-full px-4 py-3 text-left text-gray-100 hover:bg-gray-800/80 focus:outline-none focus:bg-gray-800/80 rounded-lg transition-colors flex items-start gap-2"
                >
                  <MapPin size={18} className="text-blue-400 flex-shrink-0 mt-1" />
                  <span>{result.display_name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span>
                    {language === 'es' ? 'Buscando...' : 
                     language === 'zh' ? '搜索中...' : 
                     'Searching...'}
                  </span>
                </div>
              ) : (
                <span>
                  {language === 'es' ? 'Busca una ubicación para ver resultados' : 
                   language === 'zh' ? '搜索位置以查看结果' : 
                   'Search for a location to see results'}
                </span>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}