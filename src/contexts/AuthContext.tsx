import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserSessionInfo {
  id: string;
  userAgent: string;
  lastActive: string;
  isCurrent: boolean;
}

// Define the shape of the SaaS auth context
type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  rememberDevice: boolean;
  setRememberDevice: (remember: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: (scope?: 'local' | 'global') => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  exportUserData: () => Promise<{ data: any; error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rememberDevice, setRememberDeviceState] = useState<boolean>(() => {
    return localStorage.getItem('journify_remember_device') !== 'false';
  });

  const setRememberDevice = (remember: boolean) => {
    setRememberDeviceState(remember);
    localStorage.setItem('journify_remember_device', remember ? 'true' : 'false');
  };

  // Initialize and setup auth subscription
  useEffect(() => {
    // Check initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes (OAuth callbacks, token refreshes, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign in with OAuth (Google / GitHub) with current origin redirect
  const signInWithOAuth = async (provider: 'google' | 'github') => {
    try {
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      const emailRedirectTo = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
        },
      });

      if (error) return { error };

      // Create fallback profile record if needed
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: email.split('@')[0],
          created_at: new Date().toISOString(),
        });
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign out (local or all devices via scope: 'global')
  const signOut = async (scope: 'local' | 'global' = 'local') => {
    try {
      const { error } = await supabase.auth.signOut({ scope });
      if (!error) {
        setSession(null);
        setUser(null);
      }
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Password reset request email
  const resetPassword = async (email: string) => {
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Set new password (used in password reset callback or account settings)
  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Resend email confirmation
  const resendVerificationEmail = async (email: string) => {
    try {
      const emailRedirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo,
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Complete Account Data Export (GDPR / Right to Portability)
  const exportUserData = async () => {
    if (!user) return { data: null, error: new Error('User not authenticated') };

    try {
      const [profileRes, entriesRes, foldersRes, tagsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('journal_entries').select('*').eq('user_id', user.id),
        supabase.from('folders').select('*').eq('user_id', user.id),
        supabase.from('tags').select('*').eq('user_id', user.id),
      ]);

      const exportPayload = {
        exportMetadata: {
          appName: 'Journify',
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          userId: user.id,
          userEmail: user.email,
        },
        profile: profileRes.data || null,
        journalEntries: entriesRes.data || [],
        folders: foldersRes.data || [],
        tags: tagsRes.data || [],
      };

      return { data: exportPayload, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  // Complete Account Deletion (Purge all data and user account)
  const deleteAccount = async () => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      // 1. Try invoking the secure server-side RPC if migration was applied
      const { error: rpcError } = await supabase.rpc('delete_user_account');

      // 2. If RPC is not available, execute client-side wipe of dependent records
      if (rpcError) {
        console.warn('RPC delete_user_account unavailable, performing row deletions:', rpcError.message);
        await supabase.from('media').delete().eq('user_id', user.id);
        await supabase.from('journal_entries').delete().eq('user_id', user.id);
        await supabase.from('folders').delete().eq('user_id', user.id);
        await supabase.from('tags').delete().eq('user_id', user.id);
        await supabase.from('profiles').delete().eq('id', user.id);
      }

      // 3. Terminate all sessions globally
      await supabase.auth.signOut({ scope: 'global' });
      setSession(null);
      setUser(null);

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const value = {
    session,
    user,
    loading,
    rememberDevice,
    setRememberDevice,
    signIn,
    signInWithOAuth,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    resendVerificationEmail,
    deleteAccount,
    exportUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
