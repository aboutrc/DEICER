import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RightsProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}
interface RightsSection {
  id: string;
  title: Record<string, string> | null;
  content: Record<string, any> | null;
  order: number;
  is_case_law: boolean;
}

const Rights: React.FC<RightsProps> = ({ language = 'en' }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [sections, setSections] = useState<RightsSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Helper function to convert content to array
  const getContentArray = (section: RightsSection, lang: string): string[] => {
    const content = section.content?.[lang] || section.content?.['en'];
    
    if (!content) return [];
    
    // If content is already an array, return it
    if (Array.isArray(content)) return content;
    
    // If content is a string, convert to array with one item
    if (typeof content === 'string') return [content];
    
    // If it's a JSONB array-like object, convert to regular array
    if (content && typeof content === 'object' && content.constructor === Object) {
      // Try to convert from JSONB array-like object to array
      try {
        const keys = Object.keys(content).filter(k => !isNaN(Number(k)));
        if (keys.length > 0) {
          return keys.sort((a, b) => Number(a) - Number(b)).map(k => content[k]);
        }
      } catch (e) {
        console.error('Error converting content to array:', e);
      }
    }
    
    return [];
  };

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('rights_sections')
          .select('*')
          .order('order');

        if (fetchError) throw fetchError;
        setSections(data || []);
      } catch (err) {
        console.error('Error fetching rights sections:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);
  
  // Expand first section by default
  useEffect(() => {
    if (sections.length > 0 && expandedSections.size === 0) {
      setExpandedSections(new Set([sections[0].id]));
    }
  }, [sections, expandedSections.size]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-gray-100">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-gray-100">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-900 p-8 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.id} className="bg-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-white hover:bg-gray-700 transition-colors"
              >
                <span className="text-xl font-bold">
                  {section.title?.[language] || section.title?.['en'] || ''}
                </span>
                {expandedSections.has(section.id) ? (
                  <ChevronDown size={24} />
                ) : (
                  <ChevronRight size={24} />
                )}
              </button>
              {expandedSections.has(section.id) && (
                <div className="px-6 pb-6">
                  <div className="space-y-4">
                    {getContentArray(section, language).length > 0 ? (
                      getContentArray(section, language).map((text, index) => (
                        <div key={index} className={`text-gray-300 ${section.is_case_law ? 'whitespace-pre-line' : ''}`}>
                          {text}
                        </div>
                      ))
                    ) : (
                      <div className="text-yellow-400">
                        No content available for {language}. Showing English content:
                        {getContentArray(section, 'en').map((text, index) => (
                          <div key={index} className="text-gray-300 mt-2">
                            {text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Rights;