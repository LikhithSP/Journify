import type { Session } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import LandingPage from './pages/LandingPage.tsx';
import BookshelfView from './pages/BookshelfView.tsx';
import BookPagesView from './pages/BookPagesView.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
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

    // Listen for auth changes
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse-slow">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
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
              {/* Landing & Auth Routes */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/app" />} />
              <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/app" />} />
              
              {/* If unauthenticated, root shows the landing hero page; if authenticated, goes to app dashboard */}
              <Route path="/" element={!session ? <LandingPage /> : <Navigate to="/app" />} />

              {/* Protected App Routes */}
              <Route path="/app" element={session ? <Layout /> : <Navigate to="/login" />}>
                <Route index element={<Navigate to="/app/library" replace />} />
                <Route path="/app/library" element={<BookshelfView />} />
                <Route path="/app/book/:bookId" element={<BookPagesView />} />
                <Route path="/app/daily/:year/:month" element={<BookPagesView />} />
                <Route path="/app/entry/new" element={<NewEntryPage />} />
                <Route path="/app/entry/:id" element={<EntryPage />} />
                <Route path="/app/entry/:id/edit" element={<EditEntryPage />} />
                <Route path="/app/profile" element={<ProfilePage />} />
                <Route path="/app/folder/:folderId" element={<FolderDashboard />} />
              </Route>

              {/* Backwards compatibility for existing /entry and /profile links */}
              <Route path="/entry/:id" element={session ? <Layout /> : <Navigate to="/login" />}>
                <Route index element={<EntryPage />} />
              </Route>
              <Route path="/entry/:id/edit" element={session ? <Layout /> : <Navigate to="/login" />}>
                <Route index element={<EditEntryPage />} />
              </Route>
              <Route path="/entry/new" element={session ? <Layout /> : <Navigate to="/login" />}>
                <Route index element={<NewEntryPage />} />
              </Route>
              <Route path="/profile" element={session ? <Layout /> : <Navigate to="/login" />}>
                <Route index element={<ProfilePage />} />
              </Route>
              <Route path="/folder/:folderId" element={session ? <Layout /> : <Navigate to="/login" />}>
                <Route index element={<FolderDashboard />} />
              </Route>
            </Routes>
          </AnimatePresence>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App
