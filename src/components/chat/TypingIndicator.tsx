'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      {/* Bot Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center shadow-lg"
      >
        <Bot className="w-5 h-5 text-white" />
      </motion.div>

      {/* Typing Animation */}
      <div className="message-assistant px-4 py-3">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 bg-primary-500 rounded-full"
              animate={{
                y: [0, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
