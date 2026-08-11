import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface RevenueFABProps {
  open: boolean;
  onToggle: () => void;
}

export function RevenueFAB({ onToggle }: RevenueFABProps) {
  return (
    <motion.button
      onClick={onToggle}
      className="fixed bottom-56 md:bottom-40 right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.7 }}
    >
      <TrendingUp className="w-6 h-6" />
      <motion.div
        className="absolute inset-0 rounded-2xl bg-white/20"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.button>
  );
}
