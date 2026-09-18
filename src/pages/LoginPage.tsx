import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { LogIn, AlertCircle, Mail, Lock, Sun, Moon, BookOpen, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { checkRateLimit } from '../lib/security';

const LOGIN_ART_URL = '/img2.webp';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const { signIn, signInWithOAuth, rememberDevice, setRememberDevice } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  const onSubmit = async (data: LoginFormData) => {
    // Rate Limiting Check
    const rateCheck = checkRateLimit(`login:${data.email.toLowerCase().trim()}`, 5, 60000, 30000);
    if (!rateCheck.allowed) {
      setLockoutRemaining(rateCheck.lockoutRemainingSeconds);
      setAuthError(`Too many failed attempts. Security rate limit engaged. Please wait ${rateCheck.lockoutRemainingSeconds} seconds.`);
      return;
    }

    setLoading(true);
    setAuthError(null);

    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setAuthError('Email verification required. Please check your inbox for the confirmation link.');
        } else {
          const attemptsLeft = rateCheck.remainingAttempts;
          setAuthError(`Invalid credentials. ${attemptsLeft > 0 ? `${attemptsLeft} attempts remaining before temporary lockout.` : ''}`);
        }
      } else {
        navigate('/home');
      }
    } catch (err) {
      setAuthError('An unexpected authentication error occurred. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    setAuthError(null);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        setAuthError(`Could not initiate ${provider} authentication: ${error.message}`);
      }
    } catch (err) {
      setAuthError(`Unable to connect to ${provider}. Check configuration.`);
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#ffffff] dark:bg-[#111113] text-neutral-900 dark:text-neutral-100 relative overflow-hidden font-sans selection:bg-[#0066ff]/20"
    >
      {/* Background Sacred Geometric Curves matching Landing Page */}
      <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-10 flex items-center justify-center">
        <svg className="w-full h-full max-w-[1400px]" viewBox="0 0 1400 900" fill="none" stroke="currentColor">
          <circle cx="700" cy="450" r="420" strokeWidth="0.8" strokeDasharray="3 3" className="text-neutral-300 dark:text-neutral-700" />
          <circle cx="700" cy="450" r="620" strokeWidth="0.8" className="text-neutral-200 dark:text-neutral-800" />
          <circle cx="1100" cy="450" r="380" strokeWidth="0.8" strokeDasharray="4 4" className="text-neutral-200 dark:text-neutral-800" />
          <line x1="100" y1="450" x2="1300" y2="450" strokeWidth="0.6" className="text-neutral-200 dark:text-neutral-800" />
        </svg>
      </div>

      {/* Floating Top Nav Pill Header matching Landing Page */}
      <header className="fixed top-4 left-0 right-0 z-50 flex justify-between items-center px-6 sm:px-10 pointer-events-none">
        <Link to="/" className="flex items-center gap-2.5 group pointer-events-auto">
          <div className="w-8 h-8 rounded-full bg-[#111] dark:bg-white flex items-center justify-center text-white dark:text-black transition-transform group-hover:scale-105">
            <BookOpen size={16} strokeWidth={2.2} />
          </div>
          <span className="font-bold text-lg tracking-tight text-neutral-900 dark:text-white">
            Journify
          </span>
        </Link>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-neutral-500 hover:text-black dark:hover:text-white transition-colors bg-white/80 dark:bg-[#18181a]/80 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 shadow-xs"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link
            to="/register"
            className="px-4 py-1.5 rounded-full text-[13px] font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs"
          >
            Create account
          </Link>
        </div>
      </header>

      {/* Main Authentication Enclave Card */}
      <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-12 overflow-hidden rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white/95 dark:bg-[#161619]/95 backdrop-blur-xl shadow-2xl shadow-black/5 dark:shadow-black/40">
        
        {/* Left Artwork & Classical Wisdom Pillar (5 cols) */}
        <div className="lg:col-span-5 relative bg-neutral-50/80 dark:bg-[#121214] p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden">
          
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-16 -left-16 w-72 h-72 bg-gradient-to-tr from-blue-300/20 to-amber-200/20 dark:from-blue-900/15 dark:to-amber-900/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Classical Quote / Philosophy */}
          <div className="relative z-10">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#0066ff]">
              Welcome Back
            </span>
            <h2 className="font-serif-headline text-3xl sm:text-4xl text-neutral-900 dark:text-neutral-100 font-normal leading-tight mt-2 mb-3">
              Your mind's quiet sanctuary awaits.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-normal">
              Return to your private enclave of honest reflections, memories, and voice journals.
            </p>
          </div>

          {/* Center Classical Statue Artwork provided by User */}
          <div className="relative my-6 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center w-full max-w-[320px] sm:max-w-[360px]"
            >
              <img
                src={LOGIN_ART_URL}
                alt="Classical sculpture reflection"
                className="w-full h-auto max-h-[340px] sm:max-h-[380px] object-contain drop-shadow-2xl select-none"
                loading="eager"
              />
            </motion.div>
          </div>

          {/* Bottom Security / Privacy Assurance */}
          <div className="relative z-10 pt-4 border-t border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-[#0066ff]" />
              <span className="font-mono text-[11px]">End-to-End Encrypted</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">Local-First Vault</span>
          </div>
        </div>

        {/* Right Auth Form Section (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          
          <div className="mb-6">
            <h1 className="font-serif-headline text-2xl sm:text-3xl text-neutral-900 dark:text-neutral-100 font-normal tracking-tight">
              Sign in to your journal
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Enter your credentials or continue with your verified identity.
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={oauthLoading !== null || loading}
              className="flex items-center justify-center py-2.5 px-4 border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-xs font-medium bg-white dark:bg-[#1a1a1d] hover:bg-neutral-50 dark:hover:bg-[#222226] text-neutral-800 dark:text-neutral-200 transition-colors shadow-xs disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {oauthLoading === 'google' ? 'Connecting...' : 'Google'}
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              disabled={oauthLoading !== null || loading}
              className="flex items-center justify-center py-2.5 px-4 border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-xs font-medium bg-white dark:bg-[#1a1a1d] hover:bg-neutral-50 dark:hover:bg-[#222226] text-neutral-800 dark:text-neutral-200 transition-colors shadow-xs disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2 fill-current text-neutral-900 dark:text-white flex-shrink-0" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              {oauthLoading === 'github' ? 'Connecting...' : 'GitHub'}
            </button>
          </div>

          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
            <span className="px-3 text-[11px] text-neutral-400 uppercase tracking-wider font-mono">Or with email</span>
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
          </div>

          {authError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-start" 
            >
              <AlertCircle size={15} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{authError}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-[#1a1a1d] border border-neutral-200 dark:border-neutral-750 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff] transition"
                  placeholder="your.mind@reflection.com"
                  {...register('email', { 
                    required: 'Email is required', 
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                <Mail size={15} className="absolute left-3 top-3 text-neutral-400" />
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Master Password
                </label>
                <Link 
                  to="/reset-password" 
                  className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-[#1a1a1d] border border-neutral-200 dark:border-neutral-750 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff] transition"
                  placeholder="••••••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
                <Lock size={15} className="absolute left-3 top-3 text-neutral-400" />
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Device Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-neutral-300 text-[#0066ff] focus:ring-0 cursor-pointer"
                />
                <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                  Remember this device for 30 days
                </span>
              </label>
            </div>

            {/* Electric Blue Pill Submit Button matching Landing Page */}
            <button
              type="submit"
              disabled={loading || lockoutRemaining > 0}
              className="w-full py-3 px-5 rounded-full bg-[#0066ff] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-medium transition-all shadow-md shadow-[#0066ff]/25 hover:shadow-lg hover:shadow-[#0066ff]/35 active:scale-[0.98] flex items-center justify-center disabled:opacity-50 gap-2 mt-2"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <LogIn size={15} />
              )}
              <span>{loading ? 'Authenticating...' : 'Sign in to Journify'}</span>
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-neutral-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-neutral-900 dark:text-neutral-100 hover:text-[#0066ff] dark:hover:text-[#0066ff] transition-colors ml-1">
              Create your free account
            </Link>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
