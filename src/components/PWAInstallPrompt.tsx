import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Sparkles, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA window
    const isInStandaloneMode = () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    if (isInStandaloneMode()) {
      setIsStandalone(true);
      return;
    }

    // Check if user dismissed prompt recently
    const dismissedAt = localStorage.getItem('journify_pwa_dismissed');
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 3 * 24 * 60 * 60 * 1000) {
      // Don't reprompt within 3 days if dismissed
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 4000);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('journify_pwa_dismissed', Date.now().toString());
  };

  if (isStandalone || (!showPrompt && !installedSuccess)) return null;

  return (
    <AnimatePresence>
      {installedSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 z-50 p-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-2xl flex items-center space-x-3 max-w-sm"
        >
          <div className="p-2 rounded-xl bg-emerald-500 text-white flex-shrink-0">
            <Check size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold">Journify Installed!</h4>
            <p className="text-[11px] text-gray-300 dark:text-gray-700">
              Access your thoughts instantly from your home screen or dock.
            </p>
          </div>
        </motion.div>
      )}

      {showPrompt && deferredPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 p-4 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 shadow-2xl max-w-sm"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-serif text-lg font-bold shadow-sm">
                J
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  <span>Install Journify</span>
                  <Sparkles size={13} className="ml-1 text-amber-500" />
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Fast offline access, native feel & instant sync.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 px-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Download size={14} />
              <span>Install App</span>
            </button>
            <button
              onClick={handleDismiss}
              className="py-2 px-3 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition"
            >
              Later
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
