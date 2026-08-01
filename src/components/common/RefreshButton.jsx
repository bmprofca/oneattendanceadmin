import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export default function RefreshButton({
  children = 'Refresh',
  loading = false,
  onClick,
  className = '',
  title = 'Refresh',
  type = 'button',
  ...rest
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={loading ? undefined : { scale: 1.02, y: -1 }}
      whileTap={loading ? undefined : { scale: 0.98 }}
      disabled={loading}
      title={title}
      className={joinClasses(
        'inline-flex items-center justify-center gap-1 rounded-lg border-2 border-gray-600 dark:border-blue-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm transition-all duration-200 hover:bg-slate-50 dark:hover:bg-gray-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...rest}
    >
     <RefreshCw size={14} />
      <span className="whitespace-nowrap">{children}</span>
    </motion.button>
  );
}
