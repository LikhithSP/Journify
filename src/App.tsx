import type { Session } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import ResetPasswordPage from './pages/ResetPasswordPage.tsx';
import Dashboard from './pages/Dashboard.tsx';
import EntryPage from './pages/EntryPage.tsx';
import NewEntryPage from './pages/NewEntryPage.tsx';
import EditEntryPage from './pages/EditEntryPage.tsx';
import Layout from './components/Layout.tsx';
import { supabase } from './lib/supabase';
import ProfilePage from './pages/ProfilePage.tsx';
import FolderDashboard from './pages/FolderDashboard';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Check active sessions and set the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes (including recovery token callbacks)
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
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public & Authentication Routes */}
              <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/" />} />
              <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/" />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              
              {/* Protected Routes */}
              <Route path="/" element={session ? <Layout /> : <Navigate to="/login" />}>
                <Route index element={<Dashboard />} />
                <Route path="/entry/new" element={<NewEntryPage />} />
                <Route path="/entry/:id" element={<EntryPage />} />
                <Route path="/entry/:id/edit" element={<EditEntryPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/folder/:folderId" element={<FolderDashboard />} />
              </Route>
            </Routes>
          </AnimatePresence>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
