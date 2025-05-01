import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AlertSystem from './components/AlertSystem';

// Lazy load components
const MapView = lazy(() => import('./components/Map'));
const RedCard = lazy(() => import('./components/RedCard'));
const Protect = lazy(() => import('./components/Protect'));
const Info = lazy(() => import('./components/Info'));
const InfoEditor = lazy(() => import('./components/InfoEditor'));
const Lupe = lazy(() => import('./components/Lupe'));
const About = lazy(() => import('./components/About'));
const Donate = lazy(() => import('./components/Donate'));
const DonateSuccess = lazy(() => import('./components/DonateSuccess'));
const Login = lazy(() => import('./components/Login'));
const Signup = lazy(() => import('./components/Signup'));
const UserProfile = lazy(() => import('./components/UserProfile'));

import type { University } from './lib/universities';
import { translations } from './translations';
import { isSupabaseConfigured } from './lib/supabase';

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-white text-xl">Loading...</div>
  </div>
);

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
      <Suspense fallback={<LoadingFallback />}>
        <AlertSystem position="top-center" maxAlerts={3} />
        <Routes>
          <Route path="/" element={
            <Layout 
              language={language} 
              onLanguageChange={handleLanguageChange}
              onUniversitySelect={handleUniversitySelect}
            >
              <Suspense fallback={<LoadingFallback />}>
                <MapView 
                  language={language} 
                  selectedUniversity={selectedUniversity}
                  onUniversitySelect={handleUniversitySelect}
                />
              </Suspense>
            </Layout>
          } />
          <Route path="/card" element={
            <Layout language={language} onLanguageChange={handleLanguageChange}>
              <Suspense fallback={<LoadingFallback />}>
                <RedCard language={language} />
              </Suspense>
            </Layout>
          } />
          <Route path="/protect" element={
            <Layout language={language} onLanguageChange={handleLanguageChange}>
              <Suspense fallback={<LoadingFallback />}>
                <Protect language={language} />
              </Suspense>
            </Layout>
          } />
          <Route path="/info" element={
            <Layout language={language} onLanguageChange={handleLanguageChange}>
              <Suspense fallback={<LoadingFallback />}>
                <Info language={language} />
              </Suspense>
            </Layout>
          } />
          <Route path="/info-editor" element={
            <Layout language={language} onLanguageChange={handleLanguageChange}>
              <Suspense fallback={<LoadingFallback />}>
                <InfoEditor language={language} />
              </Suspense>
            </Layout>
          } />
          <Route path="/lupe" element={
            <Layout language={language} onLanguageChange={handleLanguageChange}>
              <Suspense fallback={<LoadingFallback />}>
                <Lupe language={language} />
              </Suspense>
            </Layout>
          } />
          <Route path="/about" element={
            <Layout language={language} onLanguageChange={handleLanguageChange}>
              <Suspense fallback={<LoadingFallback />}>
                <About language={language} />
              </Suspense>
            </Layout>
          } />
          <Route path="/donate" element={
            <Layout language={language} onLanguageChange={handleLanguageChange}>
              <Suspense fallback={<LoadingFallback />}>
                <Donate language={language} />
              </Suspense>
            </Layout>
          } />
          <Route path="/donate-success" element={
            <Layout language={language} onLanguageChange={handleLanguageChange}>
              <Suspense fallback={<LoadingFallback />}>
                <DonateSuccess language={language} />
              </Suspense>
            </Layout>
          } />
          <Route path="/login" element={
            <Suspense fallback={<LoadingFallback />}>
              <Login language={language} />
            </Suspense>
          } />
          <Route path="/signup" element={
            <Suspense fallback={<LoadingFallback />}>
              <Signup language={language} />
            </Suspense>
          } />
          <Route path="/profile" element={
            <Layout language={language} onLanguageChange={handleLanguageChange}>
              <Suspense fallback={<LoadingFallback />}>
                <UserProfile language={language} />
              </Suspense>
            </Layout>
          } />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;