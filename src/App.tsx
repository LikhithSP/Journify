import type { Session } from '@supabase/supabase-js';
import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import Layout from './components/Layout.tsx';
import { supabase } from './lib/supabase';

// High-Performance Route-Level Code Splitting
const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.tsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.tsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.tsx'));
const HomeDashboard = lazy(() => import('./pages/HomeDashboard.tsx'));
const JournalsPage = lazy(() => import('./pages/JournalsPage.tsx'));
const EntryPage = lazy(() => import('./pages/EntryPage.tsx'));
const NewEntryPage = lazy(() => import('./pages/NewEntryPage.tsx'));
const EditEntryPage = lazy(() => import('./pages/EditEntryPage.tsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.tsx'));
const CalendarPage = lazy(() => import('./pages/CalendarPage.tsx'));
const FolderDashboard = lazy(() => import('./pages/FolderDashboard'));
const PrivacyCenterPage = lazy(() => import('./pages/PrivacyCenterPage'));

// Sleek minimal page loader
function PageLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 space-y-4">
      <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs text-gray-400 font-medium">Loading...</span>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#111113]">
        <div className="animate-pulse">
          <div className="w-10 h-10 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<PageLoadingFallback />}>
            <AnimatePresence mode="wait">
              <Routes>
                {/* Public landing page — shown to unauthenticated users at / */}
                <Route
                  path="/"
                  element={session ? <Navigate to="/home" replace /> : <LandingPage />}
                />

                {/* Auth routes */}
                <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/home" />} />
                <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/home" />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Protected app routes — all under Layout */}
                <Route path="/" element={session ? <Layout /> : <Navigate to="/login" />}>
                  <Route path="home" element={<HomeDashboard />} />
                  <Route path="journals" element={<JournalsPage />} />
                  <Route path="entry/new" element={<NewEntryPage />} />
                  <Route path="entry/:id" element={<EntryPage />} />
                  <Route path="entry/:id/edit" element={<EditEntryPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="privacy" element={<PrivacyCenterPage />} />
                  <Route path="folder/:folderId" element={<FolderDashboard />} />
                </Route>
              </Routes>
            </AnimatePresence>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
