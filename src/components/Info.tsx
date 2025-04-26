import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

interface BlogPost {
  id: string;
  title: Record<string, string> | null;
  content: Record<string, any> | null;
  published_at: string;
  order: number;
}

type Language = 'en' | 'es' | 'zh' | 'hi' | 'ar';

interface InfoProps {
  language?: Language;
}

const Info = ({ language = 'en' }: InfoProps) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const postsPerPage = 10;

  useEffect(() => {
    fetchPosts();
  }, []);

  const togglePost = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get content safely
  const getContent = (post: BlogPost, lang: string): string => {
    const content = post.content?.[lang] || post.content?.['en'];
    
    if (!content) return '';
    
    // If content is already a string, return it
    if (typeof content === 'string') return content;
    
    // If content is an array, join it
    if (Array.isArray(content)) return content.join('\n');
    
    // If it's a JSONB object that looks like an array, convert it
    if (content && typeof content === 'object') {
      try {
        const keys = Object.keys(content).filter(k => !isNaN(Number(k)));
        if (keys.length > 0) {
          return keys.sort((a, b) => Number(a) - Number(b))
            .map(k => content[k])
            .join('\n');
        }
      } catch (e) {
        console.error('Error converting content to string:', e);
      }
    }
    
    // Fallback: stringify the content
    return String(content);
  };

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  // Expand first post by default
  useEffect(() => {
    if (posts.length > 0 && expandedPosts.size === 0) {
      setExpandedPosts(new Set([posts[0].id]));
    }
  }, [posts, expandedPosts.size]);

  return (
    <div className={`min-h-screen bg-gray-900 p-8 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Posts List */}
        {loading ? (
          <div className="text-gray-400 text-center">Loading...</div>
        ) : (
          <div className="space-y-6">
            {currentPosts.map((post) => (
              <article
                key={post.id}
                className="bg-gray-800 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => togglePost(post.id)}
                  className="w-full px-6 py-6 flex items-center justify-between text-white hover:bg-gray-700 transition-colors"
                >
                  <h2 className="text-2xl font-bold">
                    {post.title?.[language] || post.title?.['en'] || 'No title available'}
                  </h2>
                  {expandedPosts.has(post.id) ? (
                    <ChevronDown size={24} />
                  ) : (
                    <ChevronRight size={24} />
                  )}
                </button>
                {expandedPosts.has(post.id) && (
                  <div className="px-6 pb-6 pt-4">
                    <div 
                      className="text-gray-300 prose prose-invert max-w-none space-y-4"
                    >
                      {/* Show warning if content not available in current language */}
                      {!post.content?.[language] && post.content?.['en'] && (
                        <div className="p-2 bg-yellow-900/50 text-yellow-100 rounded mb-4">
                          Content not available in {language}. Showing English content instead.
                        </div>
                      )}
                      
                      {/* Render content */}
                      <div dangerouslySetInnerHTML={{ 
                        __html: getContent(post, language)
                      }} />
                    </div>
                    {getContent(post, language).includes('NEA') && (
                      <div className="mt-8 space-y-4">
                        <a 
                          href="https://www.nea.org/resource-library/immigration" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                        >
                          {language === 'es' ? 'Artículo de NEA sobre Inmigración' :
                           language === 'zh' ? 'NEA移民指南文章' :
                           language === 'hi' ? 'NEA का आव्रजन मार्गदर्शन लेख' :
                           language === 'ar' ? 'مقال NEA حول الهجرة' :
                           'NEA Article on Immigration Guidance'}
                        </a>
                        <a 
                          href="https://www.nea.org/sites/default/files/2020-07/Immigration%20Guidance%20for%20Educators.pdf"
                          target="_blank"
                          rel="noopener noreferrer" 
                          className="block px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-center font-medium"
                        >
                          {language === 'es' ? 'Descargar PDF de Orientación' :
                           language === 'zh' ? '下载指南PDF' :
                           language === 'hi' ? 'मार्गदर्शन PDF डाउनलोड करें' :
                           language === 'ar' ? 'تحميل PDF الإرشادات' :
                           'Download Guidance PDF'}
                        </a>
                      </div>
                    )}
                    {post.published_at && (
                      <div className="mt-6 text-gray-400 text-sm">
                        {new Date(post.published_at).toLocaleDateString(
                          language === 'es' ? 'es-ES' :
                          language === 'zh' ? 'zh-CN' :
                          language === 'hi' ? 'hi-IN' :
                          language === 'ar' ? 'ar-SA' :
                          'en-US',
                          { 
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }
                        )}
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Info;