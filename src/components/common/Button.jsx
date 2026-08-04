import { motion } from 'framer-motion';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false,
  className = ''
}) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/30'
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.02, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 
        ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} 
        ${className}`}
    >
      {children}
    </motion.button>
  );
};

export default Button;