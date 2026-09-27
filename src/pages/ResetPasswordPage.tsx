import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { evaluatePasswordStrength } from '../lib/security';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword, resetPassword, user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if user reached page via Supabase recovery link (has hash or active session)
    if (user || window.location.hash.includes('type=recovery')) {
      setIsRecoverySession(true);
    }
  }, [user]);

  const strength = evaluatePasswordStrength(newPassword);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage('Your password has been successfully reset! Redirecting...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!requestEmail || !requestEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(requestEmail);
      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage('Password reset link sent! Check your email inbox and spam folder.');
      }
    } catch (err) {
      setErrorMessage('Failed to send reset email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-neutral-950 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl"
      >
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
        >
          <ArrowLeft size={14} className="mr-1" />
          Back to sign in
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">
            <KeyRound size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              {isRecoverySession ? 'Set new password' : 'Reset your password'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isRecoverySession
                ? 'Enter your new SaaS account password below'
                : 'Enter your verified email to receive a recovery link'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs flex items-start"
          >
            <AlertCircle size={15} className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-start"
          >
            <CheckCircle2 size={15} className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {isRecoverySession ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-black dark:focus:ring-white outline-none transition"
                />
                <Lock size={15} className="absolute left-3 top-2.5 text-gray-400" />
              </div>

              {/* Password strength indicators */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>Password strength:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {strength.feedback}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex gap-1">
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
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-black dark:focus:ring-white outline-none transition"
                />
                <Lock size={15} className="absolute left-3 top-2.5 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-md bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Updating password...' : 'Update Password'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Email
              </label>
              <input
                type="email"
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-black dark:focus:ring-white outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-md bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Sending link...' : 'Send Recovery Email'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
