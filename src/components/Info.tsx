import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronDown, AlertTriangle, Calendar, User, ExternalLink, BookOpen } from 'lucide-react';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }

      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getContent = (post: BlogPost, lang: string): string => {
    const content = post.content?.[lang] || post.content?.['en'];
    if (!content) return '';
    return typeof content === 'string' ? content : String(content);
  };

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  return (
    <div className={`min-h-screen bg-gray-900 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          {language === 'es' ? 'Información' :
           language === 'zh' ? '信息' :
           language === 'hi' ? 'जानकारी' :
           language === 'ar' ? 'معلومات' :
           'Information'}
        </h1>

        {error && (
          <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg mb-8 flex items-center">
            <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">
              {language === 'es' ? 'Cargando...' :
               language === 'zh' ? '加载中...' :
               language === 'hi' ? 'लोड हो रहा है...' :
               language === 'ar' ? 'جار التحميل...' :
               'Loading...'}
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {language === 'es' ? 'No hay publicaciones disponibles.' :
             language === 'zh' ? '没有可用的帖子。' :
             language === 'hi' ? 'कोई पोस्ट उपलब्ध नहीं है।' :
             language === 'ar' ? 'لا توجد منشورات متاحة.' :
             'No posts available.'}
          </div>
        ) : (
          <div className="grid gap-6">
            {currentPosts.map((post) => (
              <div
                key={post.id}
                className={`bg-gray-800/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl border border-gray-700/50 transition-all duration-300 ${
                  expandedPosts.has(post.id) ? 'ring-2 ring-blue-500/50' : 'hover:border-gray-600'
                }`}
              >
                {/* Card Header */}
                <div className="px-6 py-5 cursor-pointer" onClick={() => togglePost(post.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                        {post.title?.[language] || post.title?.['en'] || 'No title available'}
                      </h2>

                      <div className="flex flex-wrap items-center mt-3 text-gray-400 text-sm gap-4">
                        {post.published_at && (
                          <div className="flex items-center">
                            <Calendar size={16} className="mr-1.5 text-gray-500" />
                            <span>
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
                            </span>
                          </div>
                        )}

                        {post.author_id && (
                          <div className="flex items-center">
                            <User size={16} className="mr-1.5 text-gray-500" />
                            <span>DEICER Team</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`p-2 rounded-full bg-gray-700/50 transition-transform duration-300 flex-shrink-0 ${
                      expandedPosts.has(post.id) ? 'rotate-180 bg-blue-600/50' : ''
                    }`}>
                      <ChevronDown size={22} className="text-gray-300" />
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                {expandedPosts.has(post.id) && (
                  <>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>

                    <div className="px-6 py-6 bg-gray-800/30">
                      {!post.content?.[language] && post.content?.['en'] && (
                        <div className="p-3 bg-yellow-900/50 text-yellow-100 rounded-lg mb-6 text-sm flex items-start">
                          <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                          <span>
                            {language === 'es' ? 'Contenido no disponible en español. Mostrando contenido en inglés.' :
                             language === 'zh' ? '内容不适用于中文。显示英文内容。' :
                             language === 'hi' ? 'सामग्री हिंदी में उपलब्ध नहीं है। अंग्रेजी सामग्री दिखा रहा है।' :
                             language === 'ar' ? 'المحتوى غير متوفر باللغة العربية. عرض المحتوى باللغة الإنجليزية.' :
                             `Content not available in ${language}. Showing English content instead.`}
                          </span>
                        </div>
                      )}

                      <div
                        className="prose prose-invert max-w-none prose-headings:text-blue-300 prose-a:text-blue-400 prose-strong:text-white"
                        dangerouslySetInnerHTML={{ __html: getContent(post, language) }}
                      ></div>

                      {getContent(post, language).includes('NEA') && (
                        <div className="mt-8 space-y-4 bg-gray-900/50 p-5 rounded-lg border border-gray-700">
                          <h3 className="text-lg font-semibold text-white flex items-center">
                            <BookOpen size={18} className="mr-2 text-blue-400" />
                            {language === 'es' ? 'Recursos Adicionales' :
                             language === 'zh' ? '额外资源' :
                             language === 'hi' ? 'अतिरिक्त संसाधन' :
                             language === 'ar' ? 'موارد إضافية' :
                             'Additional Resources'}
                          </h3>

                          <a
                            href="https://www.nea.org/resource-library/immigration"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-3 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium group"
                          >
                            <span className="flex-1">
                              {language === 'es' ? 'Artículo de NEA sobre Inmigración' :
                               language === 'zh' ? 'NEA移民指南文章' :
                               language === 'hi' ? 'NEA का आव्रजन मार्गदर्शन लेख' :
                               language === 'ar' ? 'مقال NEA حول الهجرة' :
                               'NEA Article on Immigration Guidance'}
                            </span>
                            <ExternalLink size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                          </a>

                          <a
                            href="https://www.nea.org/sites/default/files/2020-07/Immigration%20Guidance%20for%20Educators.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-3 bg-gray-700/80 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium group"
                          >
                            <span className="flex-1">
                              {language === 'es' ? 'Descargar PDF de Orientación' :
                               language === 'zh' ? '下载指南PDF' :
                               language === 'hi' ? 'मार्गदर्शन PDF डाउनलोड करें' :
                               language === 'ar' ? 'تحميل PDF الإرشادات' :
                               'Download Guidance PDF'}
                            </span>
                            <ExternalLink size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
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