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
        'inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-400 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 rounded-lg shadow-sm transition-colors',
        className
      )}
      {...rest}
    >
      <RefreshCw size={14} />
      <span className="whitespace-nowrap">{children}</span>
    </motion.button>
  );
}
