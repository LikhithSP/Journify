import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  AlertCircle,
  Mail,
  Lock,
  Sun,
  Moon,
  CheckCircle2,
  Shield,
  ArrowRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { evaluatePasswordStrength } from '../lib/security';

const REGISTER_ART_URL = '/img2.webp';

interface RegisterFormData {
  email: string;
  password: string;
  passwordConfirm: string;
}

// Stagger children animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();
  const { signUp, signInWithOAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState(false);

  const password = watch('password', '');
  const strength = evaluatePasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    if (strength.score < 2) {
      setAuthError('Please choose a stronger password before creating your account.');
      return;
    }
    setLoading(true);
    setAuthError(null);
    try {
      const { error } = await signUp(data.email, data.password);
      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already in use')) {
          setAuthError('This email is already associated with an account. Please sign in instead.');
        } else {
          setAuthError(error.message);
        }
      } else {
        setVerificationNotice(true);
      }
    } catch (err) {
      setAuthError('An unexpected registration error occurred. Please try again.');
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
        setAuthError(`Could not initiate ${provider} registration: ${error.message}`);
      }
    } catch (err) {
      setAuthError(`Unable to connect to ${provider}.`);
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      className="min-h-screen flex items-start sm:items-center justify-center pt-20 sm:pt-6 lg:pt-8 pb-8 px-4 sm:px-6 lg:px-8 bg-[#ffffff] dark:bg-[#111113] text-neutral-900 dark:text-neutral-100 relative overflow-hidden font-sans selection:bg-[#0066ff]/20"
    >
      {/* Background Sacred Geometric Curves */}
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-10 flex items-center justify-center"
      >
        <svg className="w-full h-full max-w-[1400px]" viewBox="0 0 1400 900" fill="none" stroke="currentColor">
          <circle cx="700" cy="450" r="420" strokeWidth="0.8" strokeDasharray="3 3" className="text-neutral-300 dark:text-neutral-700" />
          <circle cx="700" cy="450" r="620" strokeWidth="0.8" className="text-neutral-200 dark:text-neutral-800" />
          <circle cx="300" cy="450" r="380" strokeWidth="0.8" strokeDasharray="4 4" className="text-neutral-200 dark:text-neutral-800" />
          <line x1="100" y1="450" x2="1300" y2="450" strokeWidth="0.6" className="text-neutral-200 dark:text-neutral-800" />
        </svg>
      </motion.div>

      {/* Floating Top Nav Pill Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-4 left-0 right-0 z-50 flex justify-between items-center px-6 sm:px-10 pointer-events-none"
      >
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
            to="/login"
            className="px-4 py-1.5 rounded-full text-[13px] font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs"
          >
            Sign in
          </Link>
        </div>
      </motion.header>

      {/* Main Authentication Enclave Card — Art LEFT, Form RIGHT (matches LoginPage) */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-12 overflow-hidden rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white/95 dark:bg-[#161619]/95 backdrop-blur-xl shadow-2xl shadow-black/5 dark:shadow-black/40"
      >

        {/* LEFT — Artwork Pillar (5 cols) */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="hidden lg:flex lg:col-span-5 relative bg-neutral-50/80 dark:bg-[#121214] p-8 sm:p-10 flex-col justify-between border-b lg:border-b-0 lg:border-r border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden"
        >
          {/* Ambient glow */}
          <div className="absolute -top-16 -left-16 w-72 h-72 bg-gradient-to-br from-violet-300/25 to-amber-200/25 dark:from-violet-900/20 dark:to-amber-900/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-tl from-blue-300/15 to-rose-200/10 dark:from-blue-900/10 dark:to-rose-900/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top label */}
          <div className="relative z-10">
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-[11px] font-semibold uppercase tracking-widest text-[#0066ff] flex items-center gap-1.5"
            >
              <Sparkles size={11} />
              Begin Your Journey
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif-headline text-3xl sm:text-4xl text-neutral-900 dark:text-neutral-100 font-normal leading-tight mt-2 mb-3"
            >
              Your story starts here.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-normal"
            >
              Join thousands who cultivate clarity and self-knowledge through the ancient art of journaling, reimagined for the modern age.
            </motion.p>
          </div>

          {/* Classical artwork — dramatic mirrored flip-in reveal */}
          <div className="relative my-6 flex items-center justify-center" style={{ perspective: '900px' }}>
            {/* Outer glow pulse */}
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.55, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400/20 to-amber-300/20 dark:from-violet-600/15 dark:to-amber-500/15 blur-2xl pointer-events-none"
            />
            <motion.div
              initial={{ rotateY: 90, opacity: 0, scale: 0.85 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
              whileHover={{ scale: 1.04, y: -6, transition: { duration: 0.45, ease: 'easeOut' } }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative flex items-center justify-center w-full max-w-[320px] sm:max-w-[360px]"
            >
              {/* Slow-spin dashed halo ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-dashed border-neutral-300/50 dark:border-neutral-600/40 scale-[1.12] pointer-events-none"
              />
              {/* Slow counter-spin inner ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-dotted border-[#0066ff]/20 scale-[0.95] pointer-events-none"
              />
              {/* Mirrored artwork */}
              <img
                src={REGISTER_ART_URL}
                alt="Classical sculpture — a new beginning"
                className="w-full h-auto max-h-[340px] sm:max-h-[380px] object-contain drop-shadow-2xl select-none relative z-10"
                style={{ transform: 'scaleX(-1)' }}
                loading="eager"
              />
            </motion.div>
          </div>

          {/* Bottom footer */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="relative z-10 pt-4 border-t border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400"
          >
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-[#0066ff]" />
              <span className="font-mono text-[11px]">End-to-End Encrypted</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">Free Forever</span>
          </motion.div>
        </motion.div>

        {/* RIGHT — Registration Form Section (7 cols on lg, full on mobile) */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
          {/* Mobile-only compact brand header */}
          <div className="flex items-center gap-2 mb-5 lg:hidden">
            <div className="w-7 h-7 rounded-full bg-[#111] dark:bg-white flex items-center justify-center text-white dark:text-black">
              <BookOpen size={14} strokeWidth={2.2} />
            </div>
            <span className="font-bold text-base tracking-tight text-neutral-900 dark:text-white">Journify</span>
          </div>
          <AnimatePresence mode="wait">
            {verificationNotice ? (
              <motion.div
                key="verify"
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-center py-6"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
                  className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 size={32} />
                </motion.div>
                <h2 className="font-serif-headline text-2xl sm:text-3xl text-neutral-900 dark:text-neutral-100 font-normal mb-2">
                  Check your inbox!
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto mb-6 leading-relaxed">
                  We have sent an activation link to your email. Click the link to confirm your account and enter your sanctuary.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/login')}
                  className="py-3 px-6 rounded-full bg-[#0066ff] hover:bg-[#0052cc] text-white text-xs font-medium transition-colors shadow-md shadow-[#0066ff]/25"
                >
                  Proceed to sign in
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
              >
                <motion.div variants={itemVariants} className="mb-6">
                  <h1 className="font-serif-headline text-2xl sm:text-3xl text-neutral-900 dark:text-neutral-100 font-normal tracking-tight">
                    Create your account
                  </h1>
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Start your private, cloud-synced journaling practice today.
                  </p>
                </motion.div>

                {/* OAuth Buttons */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleOAuthLogin('google')}
                    disabled={oauthLoading !== null || loading}
                    className="flex items-center justify-center py-2.5 px-4 border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-xs font-medium bg-white dark:bg-[#1a1a1d] hover:bg-neutral-50 dark:hover:bg-[#222226] text-neutral-800 dark:text-neutral-200 transition-all shadow-xs disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    {oauthLoading === 'google' ? 'Connecting...' : 'Google'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleOAuthLogin('github')}
                    disabled={oauthLoading !== null || loading}
                    className="flex items-center justify-center py-2.5 px-4 border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-xs font-medium bg-white dark:bg-[#1a1a1d] hover:bg-neutral-50 dark:hover:bg-[#222226] text-neutral-800 dark:text-neutral-200 transition-all shadow-xs disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 mr-2 fill-current text-neutral-900 dark:text-white flex-shrink-0" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    {oauthLoading === 'github' ? 'Connecting...' : 'GitHub'}
                  </motion.button>
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-center my-4">
                  <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
                  <span className="px-3 text-[11px] text-neutral-400 uppercase tracking-wider font-mono">Or with email</span>
                  <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
                </motion.div>

                <AnimatePresence>
                  {authError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-start"
                    >
                      <AlertCircle size={15} className="mr-2 mt-0.5 flex-shrink-0" />
                      <span>{authError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <motion.div variants={itemVariants}>
                    <label htmlFor="email" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-[#1a1a1d] border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff] transition"
                        placeholder="your.mind@reflection.com"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
                        })}
                      />
                      <Mail size={15} className="absolute left-3 top-3 text-neutral-400" />
                    </div>
                    {errors.email && <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.email.message}</p>}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label htmlFor="password" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-[#1a1a1d] border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff] transition"
                        placeholder="••••••••••••"
                        {...register('password', {
                          required: 'Password is required',
                          minLength: { value: 8, message: 'Password must be at least 8 characters' },
                        })}
                      />
                      <Lock size={15} className="absolute left-3 top-3 text-neutral-400" />
                    </div>
                    {errors.password && <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.password.message}</p>}
                    <AnimatePresence>
                      {password && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px] text-neutral-500">
                            <span>Strength: {strength.feedback}</span>
                            <span>{strength.hasMinLength ? '✓ 8+ chars' : '× Min 8 chars'}</span>
                          </div>
                          <div className="h-1 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex gap-1">
                            {[1, 2, 3, 4].map((step) => (
                              <motion.div
                                key={step}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: strength.score >= step ? 1 : 0 }}
                                transition={{ duration: 0.3, delay: step * 0.04 }}
                                style={{ originX: 0 }}
                                className={`h-full flex-1 rounded-full ${
                                  strength.score >= step
                                    ? strength.score <= 2 ? 'bg-amber-500' : 'bg-emerald-500'
                                    : 'bg-transparent'
                                }`}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label htmlFor="passwordConfirm" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="passwordConfirm"
                        type="password"
                        autoComplete="new-password"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-[#1a1a1d] border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff] transition"
                        placeholder="••••••••••••"
                        {...register('passwordConfirm', {
                          required: 'Please confirm your password',
                          validate: (value) => value === password || 'Passwords do not match',
                        })}
                      />
                      <Lock size={15} className="absolute left-3 top-3 text-neutral-400" />
                    </div>
                    {errors.passwordConfirm && <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.passwordConfirm.message}</p>}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0,102,255,0.4)' }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-5 rounded-full bg-[#0066ff] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-medium transition-colors shadow-md shadow-[#0066ff]/25 flex items-center justify-center disabled:opacity-50 gap-2 mt-2"
                    >
                      {loading ? (
                        <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <UserPlus size={15} />
                      )}
                      <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                      {!loading && <ArrowRight size={14} />}
                    </motion.button>
                  </motion.div>
                </form>

                <motion.div variants={itemVariants} className="mt-6 text-center text-xs text-neutral-500">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-neutral-900 dark:text-neutral-100 hover:text-[#0066ff] dark:hover:text-[#0066ff] transition-colors ml-1">
                    Sign in instead
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>
    </motion.div>
  );
}
