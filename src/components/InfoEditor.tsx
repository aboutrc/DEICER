import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronRight, Pencil, Plus, Save, Trash2, GripVertical, Link as LinkIcon, Image } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Auth from './Auth';

interface InfoEditorProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

interface Session {
  user: {
    id: string;
    email?: string;
  } | null;
}

interface BlogPost {
  id: string;
  title: Record<string, string>;
  content: Record<string, string>;
  published_at: string | null;
  author_id: string | null;
  order: number;
}

const InfoEditor: React.FC<InfoEditorProps> = ({ language = 'en' }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPost, setNewPost] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [reordering, setReordering] = useState(false);
  const [translating, setTranslating] = useState(false);

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts...');
      const { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .order('order', { ascending: true })
        .order('created_at', { ascending: true });

      console.log('Fetch response:', { data, error: fetchError });

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    fetchPosts();

    return () => subscription.unsubscribe();
  }, []);

  // If not authenticated, show auth component
  if (!session) {
    return <Auth language={language} />;
  }

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

  const startEditing = async (post: BlogPost) => {
    try {
      // Verify the post still exists before editing
      const { data: existingPost, error: checkError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', post.id)
        .single();

      if (checkError) {
        throw checkError;
      }

      if (!existingPost) {
        console.error('Post no longer exists:', post.id);
        setError('This post no longer exists. It may have been deleted.');
        // Remove the non-existent post from the local state
        setPosts(currentPosts => currentPosts.filter(p => p.id !== post.id));
        return;
      }

      setEditingPost(existingPost);
      setCurrentTitle(existingPost.title[language] || existingPost.title['en'] || '');
      setCurrentContent(existingPost.content[language] || existingPost.content['en'] || '');
      setNewPost(false);
      setError(null);
    } catch (err) {
      console.error('Error starting edit:', err);
      setError('Failed to load post for editing');
    }
  };

  const startNewPost = () => {
    setNewPost(true);
    setEditingPost(null);
    setCurrentTitle('');
    setCurrentContent('');
    setError(null);
  };

  const cancelEditing = () => {
    setEditingPost(null);
    setNewPost(false);
    setCurrentTitle('');
    setCurrentContent('');
  };

  const validatePost = () => {
    if (!currentTitle.trim()) {
      throw new Error('Title is required');
    }

    if (currentTitle.length > 200) {
      throw new Error('Title must be less than 200 characters');
    }

    if (!currentContent.trim()) {
      throw new Error('Content cannot be empty');
    }

    if (currentContent.length > 10000) {
      throw new Error('Content must be less than 10000 characters');
    }

    return currentContent;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate session and user ID
      if (!session?.user?.id) {
        console.error('Authentication error: No user session');
        throw new Error('User not authenticated');
      }

      // Validate post data
      const content = validatePost();

      // Create translations for all languages
      const languages = ['en', 'es', 'zh', 'hi', 'ar'];
      const updatedTitle = languages.reduce((acc, lang) => ({
        ...acc, 
        [lang]: currentTitle 
      }), {});
      const updatedContent = languages.reduce((acc, lang) => ({
        ...acc,
        [lang]: currentContent
      }), {});

      if (editingPost) {
        // First check if the post exists and get its current data
        const { data: existingPost, error: checkError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', editingPost.id)
          .single();

        if (checkError) {
          console.error('Error checking post existence:', checkError);
          throw new Error('Failed to verify post existence');
        }

        if (!existingPost) {
          throw new Error('This post no longer exists. It may have been deleted.');
        }

        // Verify user has permission to edit this post
        if (existingPost.author_id && existingPost.author_id !== session.user.id) {
          console.error('Permission denied:', { 
            postAuthorId: existingPost.author_id, 
            currentUserId: session.user.id 
          });
          throw new Error('You do not have permission to edit this post');
        }

        // Update existing post
        const { data: updatedPost, error: updateError } = await supabase
          .from('blog_posts')
          .update({
            title: updatedTitle,
            content: updatedContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPost.id)
          .select()
          .single();

        if (updateError || !updatedPost) {
          console.error('Update error:', updateError);
          throw new Error(`Failed to update post: ${updateError.message}`);
        }

        // Update local state with the updated post
        setPosts(currentPosts => 
          currentPosts.map(p => 
            p.id === editingPost.id ? updatedPost : p
          )
        );

        cancelEditing();

      } else {
        // Get the highest order value
        const maxOrder = Math.max(...posts.map(p => p.order ?? 0), -1);

        const newPostData = {
          title: updatedTitle,
          content: updatedContent,
          published_at: new Date().toISOString(),
          order: maxOrder + 1,
          author_id: session.user.id
        };

        const { data: insertData, error: saveError } = await supabase
          .from('blog_posts')
          .insert(newPostData)
          .select()
          .single();

        if (saveError) {
          console.error('Insert error:', saveError);
          throw new Error(`Failed to create post: ${saveError.message}`);
        }

        if (!insertData) {
          console.error('No data returned from insert');
          throw new Error('Failed to create post - database operation failed');
        }

        await fetchPosts();
        cancelEditing();
      }
    } catch (err) {
      console.error('Error saving post:', err);
      setError(err instanceof Error ? err.message : 'Failed to save post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTranslate = async () => {
    try {
      setTranslating(true);
      setError(null);
      
      // Get all posts that need translation
      const postsToTranslate = posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content
      }));

      // Call the translation function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ posts: postsToTranslate })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Translation failed');
      }

      // Refresh posts after translation
      await fetchPosts();
      setTranslating(false);
      setError(null);
    } catch (err) {
      console.error('Error translating posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to translate posts');
      setTranslating(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      setError(null);
      
      // Confirm before deleting
      if (!window.confirm('Are you sure you want to delete this post?')) {
        return;
      }
      
      const { error: deleteError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (deleteError) throw deleteError;
      
      // Remove from expanded posts set
      setExpandedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      
      // Update local state without refetching
      setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    setError(null);

    try {
      const items = Array.from(posts);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      // First update local state for immediate feedback
      const updatedPosts = items.map((post, index) => ({
        ...post,
        order: index 
      }));
      setPosts(updatedPosts);

      // Then update the database
      const { error } = await supabase
        .from('blog_posts')
        .upsert(
          updatedPosts.map(post => ({
            id: post.id,
            order: post.order,
            updated_at: new Date().toISOString()
          }))
        );

      if (error) throw error;
    } catch (err) {
      console.error('Error updating post order:', err);
      setError('Failed to update post order');
      // Revert to original order on error
      await fetchPosts();
    }
  };

  return (
    <div className={`min-h-screen bg-gray-900 p-8 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Post Editor</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={startNewPost}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              <span>New Post</span>
            </button>
            <button
              onClick={handleTranslate}
              disabled={translating}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <span>{translating ? 'Translating...' : 'Translate All'}</span>
            </button>
            <button
              onClick={() => setReordering(!reordering)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                reordering 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              <GripVertical size={20} />
              <span>{reordering ? 'Done Reordering' : 'Reorder Posts'}</span>
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-100 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
          
        {(editingPost || newPost) && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <div className="space-y-4">
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                placeholder="Post title..."
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={200}
              />
              <div className="bg-gray-700 rounded-lg overflow-hidden">
                <Editor
                  apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                  value={currentContent}
                  onEditorChange={(content) => setCurrentContent(content)}
                  init={{
                    height: 400,
                    menubar: false,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'link'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                      'bold italic forecolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                     'removeformat | link image | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; color: #e5e7eb; }',
                    skin: 'oxide-dark',
                    content_css: 'dark',
                    link_default_target: '_blank',
                    link_assume_external_targets: true,
                    link_title: false,
                    link_context_toolbar: true,
                    link_rel_list: [
                      { title: 'None', value: '' },
                      { title: 'No follow', value: 'nofollow' },
                      { title: 'No opener', value: 'noopener' },
                      { title: 'No referrer', value: 'noreferrer' }
                    ],
                    link_target_list: [
                      { title: 'New window', value: '_blank' },
                      { title: 'Same window', value: '_self' }
                    ],
                    images_upload_handler: async function (blobInfo, progress) {
                      try {
                        const file = blobInfo.blob();
                        const fileName = `${Date.now()}-${blobInfo.filename()}`;
                        
                        // Upload to public directory
                        const { data, error } = await supabase.storage
                          .from('blog-images')
                          .upload(fileName, file, {
                            cacheControl: '3600',
                            upsert: false
                          });
                        
                        if (error) throw error;
                        
                        // Get public URL
                        const { data: { publicUrl } } = supabase.storage
                          .from('blog-images')
                          .getPublicUrl(fileName);
                        
                        return publicUrl;
                      } catch (error) {
                        console.error('Image upload error:', error);
                        return Promise.reject('Image upload failed');
                      }
                    },
                    image_dimensions: false,
                    image_class_list: [
                      { title: 'None', value: '' },
                      { title: 'Responsive', value: 'img-fluid rounded' }
                    ],
                    file_picker_types: 'image',
                    automatic_uploads: true
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save size={20} />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-gray-400 text-center">Loading posts...</div>
        ) : !editingPost && !newPost && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="posts">
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {posts.map((post, index) => (
                    <Draggable
                      key={post.id}
                      draggableId={post.id}
                      index={index}
                      isDragDisabled={!reordering}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-gray-800 rounded-lg overflow-hidden ${
                            snapshot.isDragging ? 'ring-2 ring-blue-500 shadow-lg' : ''
                          }`}
                        >
                          <div className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center flex-1">
                              {reordering && (
                                <div
                                  {...provided.dragHandleProps}
                                  className="mr-4 p-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-300 rounded"
                                >
                                  <GripVertical size={20} />
                                </div>
                              )}
                              <button
                                onClick={() => togglePost(post.id)}
                                className="flex-1 flex items-center justify-between text-white hover:text-gray-300"
                              >
                                <h2 className="text-xl font-semibold">
                                  {post.title?.[language] || post.title?.['en'] || ''}
                                </h2>
                                {expandedPosts.has(post.id) ? (
                                  <ChevronDown size={20} />
                                ) : (
                                  <ChevronRight size={20} />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => startEditing(post)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                              >
                                
                                <Pencil size={20} />
                              </button>
                              <button
                                onClick={() => handleDelete(post.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-lg"
                                aria-label="Delete post"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>

                          {expandedPosts.has(post.id) && (
                            <div className="px-6 pb-6">
                              <div 
                                className="text-gray-300 prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ 
                                  __html: (post.content?.[language] || post.content?.['en'] || '').toString()
                                }}
                              />
                              {post.published_at && (
                                <div className="mt-4 text-gray-500 text-sm">
                                  Published: {new Date(post.published_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
};

export default InfoEditor;