'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SuccessToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function SuccessToast({ message, isVisible, onClose, duration = 4000 }: SuccessToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          onClose();
          return 0;
        }
        return prev - (100 / (duration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, duration, onClose]);

  useEffect(() => {
    if (isVisible) {
      setProgress(100);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.95 }}
          className="fixed top-4 right-4 z-50 bg-white border border-green-200 rounded-xl shadow-2xl overflow-hidden max-w-sm"
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"
                >
                  <Check className="w-5 h-5 text-green-600" />
                </motion.div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900 mb-1">Success!</p>
                <p className="text-sm text-green-700">{message}</p>
              </div>
              
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-1 bg-green-100">
            <motion.div
              className="h-full bg-green-500"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}