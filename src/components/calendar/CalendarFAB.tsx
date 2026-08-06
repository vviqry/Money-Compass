import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';

export function CalendarFAB() {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate('/calendar')}
      className="fixed bottom-24 md:bottom-8 right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.5 }}
    >
      <CalendarDays className="w-6 h-6" />
      <motion.div
        className="absolute inset-0 rounded-2xl bg-white/20"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.button>
  );
}
