import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import { ChevronDown, ChevronRight, Save, Plus, Trash2, Bold, Italic, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RightsEditorProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

interface RightsSection {
  id: string;
  title: Record<string, string>;
  content: Record<string, string[]>;
  order: number;
  is_case_law: boolean;
}

const RightsEditor: React.FC<RightsEditorProps> = ({ language = 'en' }) => {
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<RightsSection[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editingSection, setEditingSection] = useState<RightsSection | null>(null); 
  const [loading, setLoading] = useState(true);
  const [nextOrder, setNextOrder] = useState(1);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('rights_sections')
          .select('*')
          .order('order');

        if (fetchError) throw fetchError;
        setSections(data || []);
        // Set next order based on existing sections
        const maxOrder = Math.max(...(data?.map(s => s.order) || [0]));
        setNextOrder(maxOrder + 1);
      } catch (err) {
        console.error('Error fetching rights sections:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  const handleSave = async (section: RightsSection, content: string[]) => {
    try {
      // Create translations for all languages
      const languages = ['en', 'es', 'zh', 'hi', 'ar'];
      const updatedContent = languages.reduce((acc, lang) => ({
        ...acc,
        [lang]: content
      }), {});

      // Get current title and create translations
      const title = section.title[language] || section.title['en'];
      const updatedTitle = languages.reduce((acc, lang) => ({
        ...acc,
        [lang]: title
      }), {});

      const { error: updateError } = await supabase
        .from('rights_sections')
        .update({
          title: updatedTitle,
          content: updatedContent,
          order: section.order,
          is_case_law: section.is_case_law
        })
        .eq('id', section.id);

      if (updateError) throw updateError;
      setEditingSection(null);
      
      // Refresh sections after save
      const { data, error: fetchError } = await supabase
        .from('rights_sections')
        .select('*')
        .order('order');

      if (fetchError) throw fetchError;
      setSections(data || []);
      setError(null);
    } catch (err) {
      console.error('Error updating section:', err);
      setError('Failed to update section');
    }
  };

  const handleAddSection = async () => {
    try {
      const newSection = {
        title: {
          en: 'New Section',
          es: 'Nueva Sección',
          zh: '新章节',
          hi: 'नया खंड',
          ar: 'قسم جديد'
        },
        content: {
          en: ['Enter content here'],
          es: ['Ingrese contenido aquí'],
          zh: ['在此输入内容'],
          hi: ['यहां सामग्री दर्ज करें'],
          ar: ['أدخل المحتوى هنا']
        },
        order: nextOrder,
        is_case_law: false
      };

      const { data, error: insertError } = await supabase
        .from('rights_sections')
        .insert([newSection])
        .select();

      if (insertError) throw insertError;

      // Update sections and next order
      setSections([...sections, data[0]]);
      setNextOrder(nextOrder + 1);
      setEditingSection(data[0]); // Start editing the new section
      setError(null);
    } catch (err) {
      console.error('Error adding section:', err);
      setError('Failed to add section');
    }
  };

  const handleDeleteSection = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('rights_sections')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Update local state
      setSections(sections.filter(s => s.id !== id));
      if (editingSection?.id === id) {
        setEditingSection(null);
      }
      setError(null);
    } catch (err) {
      console.error('Error deleting section:', err);
      setError('Failed to delete section');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-500/20 text-red-100 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Rights Editor</h1>
          <button
            onClick={handleAddSection}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Add Section
          </button>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {section.title[language] || section.title['en']}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingSection(section)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editingSection?.id === section.id ? (
                <div>
                  <div className="mt-4">
                    <input
                      type="text"
                      value={editingSection.title[language] || editingSection.title['en']}
                      onChange={(e) => {
                        const newSection = { ...editingSection };
                        newSection.title[language] = e.target.value;
                        setEditingSection(newSection);
                      }}
                      className="w-full bg-gray-700 text-white p-2 rounded"
                    />
                    <div className="mt-4">
                      <textarea
                        value={(editingSection.content[language] || editingSection.content['en']).join('\n')}
                        onChange={(e) => { 
                          const newSection = { ...editingSection };
                          const content = e.target.value.split('\n').filter(line => line.trim());
                          newSection.content[language] = content;
                          setEditingSection(newSection);
                        }}
                        className="w-full h-64 bg-gray-700 text-white p-2 rounded"
                      />
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        onClick={() => setEditingSection(null)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleSave(editingSection, editingSection.content[language] || editingSection.content['en'])}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-gray-300 whitespace-pre-wrap">
                  {(section.content[language] || section.content['en']).join('\n')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightsEditor;