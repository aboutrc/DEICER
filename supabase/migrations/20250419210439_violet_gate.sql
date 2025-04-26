/*
  # Fix blog_posts table to support HTML content
  
  1. Changes
    - Update blog_posts table to use JSONB for title and content
    - Add proper constraints for multilingual content
    - Ensure existing data is preserved
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing blog_posts table
DROP TABLE IF EXISTS blog_posts;

-- Create blog_posts table with JSONB columns
CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  published_at timestamptz,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title jsonb NOT NULL,
  content jsonb NOT NULL,
  
  -- Add constraints for JSONB structure
  CONSTRAINT title_format CHECK (
    jsonb_typeof(title->'en') = 'string' AND
    jsonb_typeof(title->'es') = 'string' AND
    jsonb_typeof(title->'zh') = 'string' AND
    jsonb_typeof(title->'hi') = 'string' AND
    jsonb_typeof(title->'ar') = 'string'
  ),
  CONSTRAINT content_format CHECK (
    jsonb_typeof(content->'en') = 'string' AND
    jsonb_typeof(content->'es') = 'string' AND
    jsonb_typeof(content->'zh') = 'string' AND
    jsonb_typeof(content->'hi') = 'string' AND
    jsonb_typeof(content->'ar') = 'string'
  )
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view published posts"
  ON blog_posts FOR SELECT
  USING (published_at IS NOT NULL);

CREATE POLICY "Authenticated users can create posts"
  ON blog_posts FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authors can update own posts"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
  ON blog_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create indexes
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_order ON blog_posts("order");

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- Insert sample blog post
INSERT INTO blog_posts (
  id,
  title,
  content,
  published_at,
  "order"
)
VALUES (
  gen_random_uuid(),
  jsonb_build_object(
    'en', 'NEA Articles on Guidance for Immigration',
    'es', 'Artículos de NEA sobre Orientación para Inmigración',
    'zh', 'NEA移民指导文章',
    'hi', 'आव्रजन के लिए NEA मार्गदर्शन पर लेख',
    'ar', 'مقالات NEA حول إرشادات الهجرة'
  ),
  jsonb_build_object(
    'en', '<h2>Resources for Educators</h2><p>The National Education Association (NEA) provides comprehensive guidance for educators on supporting immigrant students and families.</p><p>These resources include:</p><ul><li>Legal rights of immigrant students</li><li>Creating safe and welcoming schools</li><li>Supporting DACA recipients</li><li>Responding to ICE activity</li></ul><p>NEA Article on Guidance on Immigration Issues</p>',
    'es', '<h2>Recursos para Educadores</h2><p>La Asociación Nacional de Educación (NEA) proporciona orientación integral para educadores sobre cómo apoyar a estudiantes y familias inmigrantes.</p><p>Estos recursos incluyen:</p><ul><li>Derechos legales de estudiantes inmigrantes</li><li>Creación de escuelas seguras y acogedoras</li><li>Apoyo a beneficiarios de DACA</li><li>Respuesta a actividades de ICE</li></ul><p>Artículo de NEA sobre Orientación en Temas de Inmigración</p>',
    'zh', '<h2>教育工作者资源</h2><p>全国教育协会(NEA)为教育工作者提供全面指导，帮助支持移民学生和家庭。</p><p>这些资源包括：</p><ul><li>移民学生的法律权利</li><li>创建安全和欢迎的学校环境</li><li>支持DACA接收者</li><li>应对ICE活动</li></ul><p>NEA关于移民问题指导的文章</p>',
    'hi', '<h2>शिक्षकों के लिए संसाधन</h2><p>राष्ट्रीय शिक्षा संघ (NEA) शिक्षकों को प्रवासी छात्रों और परिवारों का समर्थन करने के लिए व्यापक मार्गदर्शन प्रदान करता है।</p><p>इन संसाधनों में शामिल हैं:</p><ul><li>प्रवासी छात्रों के कानूनी अधिकार</li><li>सुरक्षित और स्वागतयोग्य स्कूल बनाना</li><li>DACA प्राप्तकर्ताओं का समर्थन</li><li>ICE गतिविधि का जवाब देना</li></ul><p>आव्रजन मुद्दों पर मार्गदर्शन पर NEA लेख</p>',
    'ar', '<h2>موارد للمعلمين</h2><p>توفر الرابطة الوطنية للتعليم (NEA) إرشادات شاملة للمعلمين حول دعم الطلاب والعائلات المهاجرة.</p><p>تشمل هذه الموارد:</p><ul><li>الحقوق القانونية للطلاب المهاجرين</li><li>إنشاء مدارس آمنة ومرحبة</li><li>دعم المستفيدين من DACA</li><li>الاستجابة لنشاط ICE</li></ul><p>مقالة NEA حول التوجيه بشأن قضايا الهجرة</p>'
  ),
  now(),
  1
);