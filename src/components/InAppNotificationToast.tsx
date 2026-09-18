import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InAppAlert {
  id: string;
  title: string;
  body: string;
}

export default function InAppNotificationToast() {
  const [activeAlert, setActiveAlert] = useState<InAppAlert | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleNotification = (e: any) => {
      const { title, body } = e.detail || {};
      setActiveAlert({
        id: `alert_${Date.now()}`,
        title: title || 'Journify Reminder',
        body: body || '',
      });

      // Auto dismiss after 7 seconds
      setTimeout(() => {
        setActiveAlert((current) => (current?.id === `alert_${Date.now()}` ? null : current));
      }, 7000);
    };

    window.addEventListener('journify_inapp_notification', handleNotification);
    return () => window.removeEventListener('journify_inapp_notification', handleNotification);
  }, []);

  if (!activeAlert) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-5 right-5 z-50 w-full max-w-sm bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-4 text-xs overflow-hidden backdrop-blur-md"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center flex-shrink-0">
              <Bell size={15} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {activeAlert.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mt-1 leading-relaxed text-[11px]">
                {activeAlert.body}
              </p>
              <button
                onClick={() => {
                  setActiveAlert(null);
                  navigate('/entry/new');
                }}
                className="inline-flex items-center text-[11px] font-semibold text-black dark:text-white mt-2 hover:underline"
              >
                Write in journal <ArrowRight size={12} className="ml-1" />
              </button>
            </div>
          </div>
          <button
            onClick={() => setActiveAlert(null)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
