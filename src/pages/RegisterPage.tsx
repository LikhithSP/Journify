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

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 overflow-hidden relative"
    >
      {/* Theme Toggle Button */}
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md hover:shadow-lg backdrop-blur-sm z-50 transition-all duration-300"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <Moon size={18} className="text-gray-800" />
        ) : (
          <Sun size={18} className="text-amber-300" />
        )}
      </motion.button>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-50 dark:opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200 dark:bg-primary-900 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200 dark:bg-indigo-900 rounded-full blur-3xl"></div>
      </div>

      {/* Abstract shapes */}
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border-4 border-primary-300 dark:border-primary-700 rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/5 w-24 h-24 border-4 border-indigo-300 dark:border-indigo-700 rounded-lg rotate-12"></div>
        <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-amber-200 dark:bg-amber-900 rounded-md rotate-45 opacity-20"></div>
      </div>
      
      {/* Register container */}
      <div className="w-full max-w-5xl z-10 flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-2xl">
        {/* Image side */}
        <div className="md:w-1/2 relative bg-primary-600 dark:bg-primary-800 hidden md:block overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/90 to-indigo-600/90 dark:from-primary-800/90 dark:to-indigo-900/90 z-10"></div>
          
          {/* Decorative SVG pattern */}
          <div className="absolute inset-0 opacity-10 z-0">
            <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white z-20 p-12">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mb-8"
            >
              <svg width="80" height="80" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                <rect x="10" y="10" width="100" height="100" rx="18" fill="white" stroke="white" strokeWidth="6"/>
                <text x="50%" y="68%" textAnchor="middle" fontSize="66" fontFamily="serif" fontWeight="bold" fill="#4f46e5">J</text>
              </svg>
            </motion.div>
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-3xl md:text-4xl font-bold mb-6 text-center"
            >
              Join Journify Today
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center mb-8 text-white/90 max-w-xs"
            >
              Start your journaling journey and capture your thoughts in a beautiful, organized way.
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap justify-center gap-3"
            >
              <span className="px-3 py-1.5 bg-white/20 rounded-full text-sm backdrop-blur-sm">Free to Use</span>
              <span className="px-3 py-1.5 bg-white/20 rounded-full text-sm backdrop-blur-sm">Privacy First</span>
              <span className="px-3 py-1.5 bg-white/20 rounded-full text-sm backdrop-blur-sm">Work Offline</span>
            </motion.div>
          </div>
          
          {/* Decorative circles */}
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-500/30 rounded-full blur-2xl"></div>
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary-400/30 rounded-full blur-2xl"></div>
        </div>
        
        {/* Form side */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="md:w-1/2 bg-white dark:bg-gray-800 p-8 md:p-12"
        >
          <motion.div 
            initial={{ y: 20 }} 
            animate={{ y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            className="text-center mb-8 md:hidden"
          >
            <div className="flex items-center justify-center mb-6">
              <motion.div 
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="mr-2"
              >
                <svg width="48" height="48" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                  <rect x="10" y="10" width="100" height="100" rx="18" fill="white" stroke="currentColor" className="text-primary-500 dark:text-primary-400" strokeWidth="6"/>
                  <text x="50%" y="68%" textAnchor="middle" fontSize="66" fontFamily="serif" fontWeight="bold" className="fill-primary-600 dark:fill-primary-300">J</text>
                </svg>
              </motion.div>
              <h1 className="text-4xl font-title font-bold bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 text-transparent bg-clip-text">Journify</h1>
            </div>
          </motion.div>

          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Create an account</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Start your journaling journey today.</p>
          
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
                  className="input w-full pl-10 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-700 transition-all"
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
                  className="input w-full pl-10 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-700 transition-all"
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
                  className="input w-full pl-10 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-700 transition-all"
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
              className="btn btn-primary w-full flex items-center justify-center mt-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 dark:from-primary-600 dark:to-primary-700 dark:hover:from-primary-500 dark:hover:to-primary-600 shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              ) : (
                <UserPlus size={18} className="mr-2" />
              )}
              <span className="font-medium">{loading ? 'Creating account...' : 'Sign Up'}</span>
            </motion.button>
          </form>
          
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="border-t border-gray-200 dark:border-gray-700 flex-grow"></div>
              <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">or</span>
              <div className="border-t border-gray-200 dark:border-gray-700 flex-grow"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Already have an account?</p>
            <Link to="/login" className="inline-block mt-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium hover:underline transition-colors">
              Sign in instead
            </Link>
          </div>
          
          <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-500">
            © {new Date().getFullYear()} Journify. All rights reserved.
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
