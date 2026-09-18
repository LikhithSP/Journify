import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { UserPlus, AlertCircle, Mail, Lock, Sun, Moon, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { evaluatePasswordStrength } from '../lib/security';

interface RegisterFormData {
  email: string;
  password: string;
  passwordConfirm: string;
}

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
      exit={{ opacity: 0 }}
      className={`min-h-screen flex items-center justify-center p-4 text-neutral-900 dark:text-neutral-100 overflow-hidden relative ${
        theme === 'light' ? 'bg-[#f6f6f7]' : 'bg-[#111113]'
      }`}
    >
      {/* Top Bar Branding */}
      <div className="fixed top-5 left-6 z-50 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-sm font-semibold tracking-tight shadow-sm">
          J
        </div>
        <span className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Journify <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 ml-1 px-1.5 py-0.5 border border-gray-300 dark:border-gray-700 rounded">SaaS</span>
        </span>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-6 p-2 rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-neutral-700 z-50 transition-colors shadow-sm"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <Moon size={16} className="text-gray-700" />
        ) : (
          <Sun size={16} className="text-gray-300" />
        )}
      </button>

      {/* Main SaaS Registration Card */}
      <div className="w-full max-w-4xl z-10 flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-neutral-900">
        
        {/* Left Side: SaaS Narrative */}
        <div className="md:w-5/12 bg-neutral-900 text-white p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-xs font-mono mb-6">
              SEC
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-white mb-3">
              Your private sanctuary, fortified.
            </h3>
            <p className="text-neutral-400 text-xs leading-relaxed mb-6">
              Build the habit of mindful journaling on an enterprise-ready foundation. Each account is isolated with dedicated cryptographic access controls.
            </p>
            <div className="space-y-3 text-xs text-neutral-300">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
                <span>Zero cross-tenant data leakage via RLS</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
                <span>MIME-validated secure attachments</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
                <span>Complete GDPR export & deletion rights</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-800 relative z-10 flex items-center justify-between text-[11px] text-neutral-500">
            <span>SOC2 Type II Ready Stack</span>
            <span>Zero-Knowledge Respect</span>
          </div>

          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        </div>

        {/* Right Side: Form or Verification Banner */}
        <div className="md:w-7/12 p-8 md:p-10 flex flex-col justify-center">
          {verificationNotice ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Verification link sent!
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xs mx-auto mb-6 leading-relaxed">
                We have sent an activation link to your email. Please click the link to confirm your account and enter your workspace.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="py-2 px-5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-lg text-xs font-semibold"
              >
                Proceed to sign in
              </button>
            </motion.div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                  Create your SaaS account
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Start with a 100% private, cloud-synced journal.
                </p>
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={oauthLoading !== null || loading}
                  className="flex items-center justify-center py-2 px-3 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200 transition-colors shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
                  className="flex items-center justify-center py-2 px-3 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200 transition-colors shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-2 fill-current text-gray-900 dark:text-white" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  {oauthLoading === 'github' ? 'Connecting...' : 'GitHub'}
                </button>
              </div>

              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                <span className="px-3 text-[11px] text-gray-400 uppercase tracking-wider font-medium">Or register with email</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
              </div>

              {authError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs flex items-start" 
                >
                  <AlertCircle size={15} className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>{authError}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
                      placeholder="you@company.com"
                      {...register('email', { 
                        required: 'Email is required', 
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                    />
                    <Mail size={15} className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
                      placeholder="••••••••"
                      {...register('password', { 
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters'
                        }
                      })}
                    />
                    <Lock size={15} className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.password.message}</p>
                  )}

                  {/* Password strength meter */}
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>Strength: {strength.feedback}</span>
                        <span>{strength.hasMinLength ? '✓ 8+ chars' : '× Min 8 chars'}</span>
                      </div>
                      <div className="h-1 w-full bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full flex-1 rounded-full transition-all ${
                              strength.score >= step
                                ? strength.score <= 2
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                                : 'bg-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="passwordConfirm" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="passwordConfirm"
                      type="password"
                      autoComplete="new-password"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
                      placeholder="••••••••"
                      {...register('passwordConfirm', { 
                        required: 'Please confirm your password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                    />
                    <Lock size={15} className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                  {errors.passwordConfirm && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.passwordConfirm.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 mt-2 rounded-lg bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block h-3.5 w-3.5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin mr-2"></span>
                  ) : (
                    <UserPlus size={14} className="mr-2" />
                  )}
                  <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-black dark:text-white hover:underline">
                  Sign in instead
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
