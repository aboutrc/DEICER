import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function translateText(text: string, targetLanguage: string) {
  try {
    const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('GOOGLE_TRANSLATE_API_KEY')}`
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
        format: 'html'
      })
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.translations[0].translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { posts } = await req.json();

    // Languages to translate to
    const targetLanguages = {
      es: 'es',
      zh: 'zh',
      hi: 'hi',
      ar: 'ar'
    };

    // Process each post
    for (const post of posts) {
      const translations: Record<string, any> = {
        title: { en: post.title.en },
        content: { en: post.content.en }
      };

      // Translate to each target language
      for (const [lang, code] of Object.entries(targetLanguages)) {
        translations.title[lang] = await translateText(post.title.en, code);
        translations.content[lang] = await translateText(post.content.en, code);
      }

      // Update the post in the database
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          title: translations.title,
          content: translations.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      if (updateError) {
        throw updateError;
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});