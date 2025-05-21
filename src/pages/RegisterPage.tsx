import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { UserPlus, AlertCircle, Mail, Lock, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface RegisterFormData {
  email: string;
  password: string;
  passwordConfirm: string;
}

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();
  const { signUp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Watch password for confirmation validation
  const password = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setAuthError(null);

    try {
      const { error } = await signUp(data.email, data.password);
      
      if (error) {
        if (error.message.includes('email')) {
          setAuthError('This email is already in use. Please try another one or sign in.');
        } else {
          setAuthError(`Registration error: ${error.message}`);
        }
      } else {
        // Show success message or navigate to confirmation page
        navigate('/login', { 
          state: { 
            message: 'Registration successful! Please check your email to confirm your account.' 
          } 
        });
      }
    } catch (err) {
      setAuthError('An unexpected error occurred. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 overflow-hidden relative"
    >
      {/* Theme Toggle Button */}
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 z-50 transition-colors"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <Moon size={16} className="text-gray-700 dark:text-gray-300" />
        ) : (
          <Sun size={16} className="text-gray-700 dark:text-gray-300" />
        )}
      </motion.button>
        {/* Notion-inspired subtle decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 dark:opacity-10">
        <div className="absolute top-20 right-20 w-96 h-96 border border-gray-200 dark:border-gray-700 rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 border border-gray-200 dark:border-gray-700 rounded-full"></div>
      </div>
        {/* Register container */}
      <div className="w-full max-w-5xl z-10 flex flex-col md:flex-row overflow-hidden rounded-lg shadow-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900">
        {/* Image side */}
        <div className="md:w-1/2 relative bg-neutral-100 dark:bg-neutral-900 hidden md:flex items-center justify-center overflow-hidden p-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 z-10"></div>
          
          {/* Notion-inspired minimal pattern */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10 z-0">
            <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-800 dark:text-gray-300" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
            <div className="absolute inset-0 flex flex-col justify-center items-center text-gray-800 dark:text-gray-100 z-20 p-12">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mb-10"
            >
              <div className="w-16 h-16 rounded bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-2xl font-medium">
                J
              </div>
            </motion.div>
            <motion.h2 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-3xl md:text-3xl font-semibold mb-6 text-center"
            >
              Join Journify Today
            </motion.h2>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center mb-8 text-gray-600 dark:text-gray-400 max-w-xs"
            >
              Start your journaling journey and capture your thoughts in a beautiful, organized way.
            </motion.p>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap justify-center gap-2"
            >
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700/50 rounded-full text-xs text-gray-600 dark:text-gray-300">Free to Use</span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700/50 rounded-full text-xs text-gray-600 dark:text-gray-300">Privacy First</span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700/50 rounded-full text-xs text-gray-600 dark:text-gray-300">Work Offline</span>
            </motion.div>
          </div>
        </div>
          {/* Form side */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="md:w-1/2 bg-white dark:bg-neutral-900 p-8 md:p-12"
        >          <motion.div 
            initial={{ y: 10 }} 
            animate={{ y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            className="text-center mb-8 md:hidden"
          >
            <div className="flex items-center justify-center mb-6">
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="mr-3"
              >
                <div className="w-10 h-10 rounded bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-lg font-medium">
                  J
                </div>
              </motion.div>
              <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">Journify</h1>
            </div>
          </motion.div>          <h2 className="text-2xl font-medium mb-4 text-gray-800 dark:text-gray-200">Create an account</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Start your journaling journey today</p>
          
          {authError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm flex items-start shadow-sm" 
              aria-live="polite"
            >
              <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{authError}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input w-full pl-10 bg-gray-50 dark:bg-[rgb(43,44,47,0.5)] border border-gray-200 dark:border-[rgb(42,42,43)] focus:border-gray-400 dark:focus:border-gray-600 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 transition-colors"
                  placeholder="you@example.com"
                  {...register('email', { 
                    required: 'Email is required', 
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
              </div>
              {errors.email && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center"
                >
                  <AlertCircle size={12} className="mr-1" />
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="input w-full pl-10 bg-gray-50 dark:bg-[rgb(43,44,47,0.5)] border border-gray-200 dark:border-[rgb(42,42,43)] focus:border-gray-400 dark:focus:border-gray-600 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 transition-colors"
                  placeholder="••••••••"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  })}
                />
              </div>
              {errors.password && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center"
                >
                  <AlertCircle size={12} className="mr-1" />
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  id="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  className="input w-full pl-10 bg-gray-50 dark:bg-[rgb(43,44,47,0.5)] border border-gray-200 dark:border-[rgb(42,42,43)] focus:border-gray-400 dark:focus:border-gray-600 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 transition-colors"
                  placeholder="••••••••"
                  {...register('passwordConfirm', { 
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                />
              </div>
              {errors.passwordConfirm && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center"
                >
                  <AlertCircle size={12} className="mr-1" />
                  {errors.passwordConfirm.message}
                </motion.p>
              )}
            </div>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center mt-6 py-2 px-4 rounded-md bg-black hover:bg-gray-800 dark:bg-[rgb(239,235,235,0.96)] dark:hover:bg-gray-200 text-white dark:text-black text-sm font-medium transition-colors"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin mr-2"></span>
              ) : (
                <UserPlus size={16} className="mr-2" />
              )}
              <span>{loading ? 'Creating account...' : 'Sign up'}</span>
            </motion.button>
          </form>
            <div className="mt-10 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="border-t border-gray-200 dark:border-gray-800 flex-grow"></div>
              <span className="mx-4 text-xs text-gray-500 dark:text-gray-400">or</span>
              <div className="border-t border-gray-200 dark:border-gray-800 flex-grow"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Already have an account?</p>
            <Link to="/login" className="inline-block mt-2 text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white font-medium transition-colors">
              Sign in instead
            </Link>
          </div>
          
          <div className="mt-10 text-center text-xs text-gray-400 dark:text-white">
            © {new Date().getFullYear()} Journify. All rights reserved.
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
