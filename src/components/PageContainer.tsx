'use client';

import { motion } from 'framer-motion';

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: '4xl' | '6xl' | '7xl';
  className?: string;
}

export default function PageContainer({ 
  children, 
  maxWidth = '6xl',
  className = ''
}: PageContainerProps) {
  const maxWidthClasses = {
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl', 
    '7xl': 'max-w-7xl'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`${maxWidthClasses[maxWidth]} mx-auto p-4 sm:p-6 lg:p-8 ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
}