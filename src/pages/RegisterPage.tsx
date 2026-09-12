import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { AlertCircle, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterFormData {
  email: string;
  password: string;
  passwordConfirm: string;
}

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0c0d12] text-white select-none font-sans antialiased flex flex-col justify-between">
      {/* Matching Background Image */}
      <img
        src="https://media.mutualart.com/Images/2021_10/17/16/163627236/d4e41784-675e-4185-a27b-ad72d0f0506f.Jpeg"
        alt="Journify background"
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none filter contrast-[1.14] brightness-[0.98] saturate-[1.06] scale-110 origin-[20%_25%]"
        style={{ objectPosition: '22% 20%', imageRendering: '-webkit-optimize-contrast' }}
      />
      
      {/* Dark Ambient Overlays & Vignette */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[6px] z-[1] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 z-[1] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 pt-7 flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xs font-bold tracking-tight text-white group-hover:scale-105 transition-transform duration-200 shadow-sm">
            J
          </div>
          <span className="font-display text-xl font-bold tracking-[-0.03em] text-white">
            Journify<span className="text-white/40 text-xs ml-1 font-normal">’26</span>
          </span>
        </Link>

        {/* Back to Home button */}
        <Link
          to="/"
          className="liquid-glass rounded-full px-4 py-1.5 text-xs font-semibold text-white/80 hover:text-white hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md static-glass rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/15 bg-black/40 backdrop-blur-2xl"
        >
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-white">
              Create an account
            </h1>
            <p className="text-white/60 text-sm mt-2 font-normal">
              Begin your private, distraction-free journaling journey
            </p>
          </div>

          {/* Auth Error Banner */}
          {authError && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-start gap-2.5 backdrop-blur-md" 
              aria-live="polite"
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
              <span>{authError}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-white/80 tracking-wide">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-white/40">
                  <Mail size={15} />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/35 focus:ring-1 focus:ring-white/20 transition-all"
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
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={11} />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-medium text-white/80 tracking-wide">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-white/40">
                  <Lock size={15} />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/35 focus:ring-1 focus:ring-white/20 transition-all"
                  placeholder="••••••••"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={11} />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="passwordConfirm" className="block text-xs font-medium text-white/80 tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-white/40">
                  <Lock size={15} />
                </div>
                <input
                  id="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/35 focus:ring-1 focus:ring-white/20 transition-all"
                  placeholder="••••••••"
                  {...register('passwordConfirm', { 
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                />
              </div>
              {errors.passwordConfirm && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={11} />
                  <span>{errors.passwordConfirm.message}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="liquid-glass w-full mt-6 py-3 px-4 rounded-xl text-sm font-semibold text-white hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg bg-white/[0.08]"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight size={15} className="text-white/80" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 text-center pt-6 border-t border-white/10">
            <p className="text-xs text-white/50">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-white font-semibold hover:underline transition-all"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Subtle Bottom Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 pb-7 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Journify. All reflections encrypted & private.
      </footer>
    </div>
  );
}
