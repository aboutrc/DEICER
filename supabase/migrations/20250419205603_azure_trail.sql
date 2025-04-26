/*
  # Update rights sections with multilingual content
  
  1. Changes
    - Clear existing content
    - Insert new multilingual content for all sections
    - Preserve existing table structure
    
  2. Security
    - Maintain existing RLS policies
*/

-- First clear existing content
TRUNCATE TABLE rights_sections;

-- Insert new content with proper translations
INSERT INTO rights_sections (id, title, content, "order", is_case_law)
VALUES
  -- Constitution Overview
  (
    gen_random_uuid(),
    jsonb_build_object(
      'en', 'The U.S. Constitution Protects Everyone',
      'es', 'La Constitución de EE.UU. Protege a Todos',
      'zh', '美国宪法保护所有人',
      'hi', 'अमेरिकी संविधान सभी की रक्षा करता है',
      'ar', 'دستور الولايات المتحدة يحمي الجميع'
    ),
    jsonb_build_array(
      'Everyone in the U.S. is Protected by the U.S. Constitution—Citizen or Not.',
      'The U.S. Constitution protects everyone that is physically in the U.S and is not meant for only citizens of the U.S.',
      'These rights ensure fair treatment for all.'
    ),
    1,
    false
  ),
  
  -- Constitutional Amendments
  (
    gen_random_uuid(),
    jsonb_build_object(
      'en', 'Important Constitutional Amendments',
      'es', 'Enmiendas Constitucionales Importantes',
      'zh', '重要宪法修正案',
      'hi', 'महत्वपूर्ण संवैधानिक संशोधन',
      'ar', 'التعديلات الدستورية المهمة'
    ),
    jsonb_build_array(
      'Fifth Amendment:',
      '• Right to stay quiet if talking might get you in trouble',
      '• Everyone gets fair treatment by the law',
      '',
      'Fourth Amendment:',
      '• Police need a warrant, a judge''s permission, to search you or your things',
      '• A warrant is different from an ICE order: A warrant comes from a judge, while an ICE order does not',
      '• Protects your privacy, including immigrants',
      '',
      'Fourteenth Amendment:',
      '• Everyone deserves fair legal processes',
      '• Laws must treat everyone equally, giving the same rights to all'
    ),
    2,
    false
  ),
  
  -- ICE Home Encounters
  (
    gen_random_uuid(),
    jsonb_build_object(
      'en', 'What Happens If ICE Comes to My Home',
      'es', 'Qué Hacer Si ICE Viene a Mi Casa',
      'zh', '如果移民局来到我家该怎么办',
      'hi', 'यदि ICE मेरे घर आता है तो क्या होगा',
      'ar', 'ماذا يحدث إذا جاء ICE إلى منزلي'
    ),
    jsonb_build_array(
      'You have the right to remain silent and do not have to discuss your immigration status',
      'Ask if they have a warrant signed by a judge. If they don''t, you can refuse to let them in',
      'Stay calm and keep the door closed',
      'If they have a valid warrant, you may have to let them in, but you still have the right to remain silent and consult a lawyer',
      'Do not sign any documents without speaking to an attorney'
    ),
    3,
    false
  ),
  
  -- ICE Street Encounters
  (
    gen_random_uuid(),
    jsonb_build_object(
      'en', 'What Happens If ICE Approaches Me on the Street',
      'es', 'Qué Hacer Si ICE Me Aborda en la Calle',
      'zh', '如果移民局在街上拦截我该怎么办',
      'hi', 'यदि ICE मुझे सड़क पर रोकता है तो क्या होगा',
      'ar', 'ماذا يحدث إذا اقترب مني ICE في الشارع'
    ),
    jsonb_build_array(
      'You have the right to remain silent and do not have to discuss your immigration status',
      'Ask if you are free to leave. If they say yes, calmly walk away',
      'You have the right to refuse to show identification or answer questions',
      'Remember, you do not have to sign any documents without speaking to an attorney'
    ),
    4,
    false
  ),
  
  -- Case Law
  (
    gen_random_uuid(),
    jsonb_build_object(
      'en', 'Important Legal Cases',
      'es', 'Casos Legales Importantes',
      'zh', '重要法律案例',
      'hi', 'महत्वपूर्ण कानूनी मामले',
      'ar', 'قضايا قانونية مهمة'
    ),
    jsonb_build_array(
      'Yick Wo v. Hopkins (1886)',
      'Established that the Equal Protection Clause of the 14th Amendment applies to all persons, not just citizens, reinforcing constitutional protections for immigrants.',
      'Learn more: https://en.wikipedia.org/wiki/Yick_Wo_v._Hopkins',
      '',
      'Zadvydas v. Davis (2001)',
      'Limited the government''s power to indefinitely detain immigrants who have been ordered removed but cannot be deported.',
      'Learn more: https://en.wikipedia.org/wiki/Zadvydas_v._Davis',
      '',
      'Plyler v. Doe (1982)',
      'Established that states cannot deny public education to undocumented immigrant children.',
      'Learn more: https://en.wikipedia.org/wiki/Plyler_v._Doe'
    ),
    5,
    true
  );