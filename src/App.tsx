import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MapView from './components/Map';
import RedCard from './components/RedCard';
import Protect from './components/Protect';
import Info from './components/Info';
import InfoEditor from './components/InfoEditor';
import Lupe from './components/Lupe';
import About from './components/About';
import Donate from './components/Donate';
import DonateSuccess from './components/DonateSuccess';
import Login from './components/Login';
import Signup from './components/Signup';
import UserProfile from './components/UserProfile';
import type { University } from './lib/universities';
import { translations } from './translations';
import { isSupabaseConfigured } from './lib/supabase';

function App() {
  const [language, setLanguage] = React.useState<'en' | 'es' | 'zh' | 'hi' | 'ar'>(
    // Get language from URL or localStorage or default to 'en'
    (window.location.search.includes('lang=') 
      ? window.location.search.split('lang=')[1].split('&')[0] 
      : localStorage.getItem('preferredLanguage')) as 'en' | 'es' | 'zh' | 'hi' | 'ar' || 'en'
  );
  const [selectedUniversity, setSelectedUniversity] = React.useState<University | null>(null);

  // Initialize Supabase connection on app load
  React.useEffect(() => {
    const initSupabase = async () => {
      const isConfigured = isSupabaseConfigured();
      console.log('Supabase configuration check:', isConfigured ? 'Configured' : 'Not configured');
    };
    
    initSupabase();
  }, []);

  const handleLanguageChange = (newLanguage: 'en' | 'es' | 'zh' | 'hi' | 'ar') => {
    setLanguage(newLanguage);
    // Store language preference
    localStorage.setItem('preferredLanguage', newLanguage);
    // Update URL with language parameter
    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLanguage);
    window.history.replaceState({}, '', url.toString());
    
    // Log language change for debugging
    console.log(`Language changed to: ${newLanguage}`);
  };

  const handleUniversitySelect = (university: University) => {
    setSelectedUniversity(university);
    console.log(`Selected university: ${university.university}`);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Layout 
            language={language} 
            onLanguageChange={handleLanguageChange}
            onUniversitySelect={handleUniversitySelect}
          >
            <MapView 
              language={language} 
              selectedUniversity={selectedUniversity}
              onUniversitySelect={handleUniversitySelect}
            />
          </Layout>
        } />
        <Route path="/card" element={
          <Layout language={language} onLanguageChange={handleLanguageChange}>
            <RedCard language={language} />
          </Layout>
        } />
        <Route path="/protect" element={
          <Layout language={language} onLanguageChange={handleLanguageChange}>
            <Protect language={language} />
          </Layout>
        } />
        <Route path="/info" element={
          <Layout language={language} onLanguageChange={handleLanguageChange}>
            <Info language={language} />
          </Layout>
        } />
        <Route path="/info-editor" element={
          <Layout language={language} onLanguageChange={handleLanguageChange}>
            <InfoEditor language={language} />
          </Layout>
        } />
        <Route path="/lupe" element={
          <Layout language={language} onLanguageChange={handleLanguageChange}>
            <Lupe language={language} />
          </Layout>
        } />
        <Route path="/about" element={
          <Layout language={language} onLanguageChange={handleLanguageChange}>
            <About language={language} />
          </Layout>
        } />
        <Route path="/donate" element={
          <Layout language={language} onLanguageChange={handleLanguageChange}>
            <Donate language={language} />
          </Layout>
        } />
        <Route path="/donate-success" element={
          <Layout language={language} onLanguageChange={handleLanguageChange}>
            <DonateSuccess language={language} />
          </Layout>
        } />
        <Route path="/login" element={
          <Login language={language} />
        } />
        <Route path="/signup" element={
          <Signup language={language} />
        } />
        <Route path="/profile" element={
          <Layout language={language} onLanguageChange={handleLanguageChange}>
            <UserProfile language={language} />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;