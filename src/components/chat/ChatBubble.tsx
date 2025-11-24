'use client';

import { motion } from 'framer-motion';
import { Bot, User, Clock } from 'lucide-react';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import { ServiceCard } from './ServiceCard';
import { AirQualityCard } from './AirQualityCard';
import { RouteCard } from './RouteCard';

interface ChatBubbleProps {
  message: Message;
  className?: string;
}

export function ChatBubble({ message, className }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn('flex items-start gap-3', isUser && 'flex-row-reverse', className)}
    >
      {/* Avatar with better design */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg',
          isUser
            ? 'bg-gradient-to-br from-primary-500 to-primary-600'
            : 'bg-gradient-to-br from-secondary-500 to-secondary-600'
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </motion.div>

      {/* Message Content */}
      <div className={cn('flex-1 max-w-2xl space-y-3', isUser && 'flex flex-col items-end')}>
        {/* Text Message with new styles */}
        <motion.div
          initial={{ opacity: 0, x: isUser ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            'px-4 py-3 max-w-2xl',
            isUser
              ? 'message-user'
              : 'message-assistant'
          )}
        >
          <p className={cn(
            'text-sm leading-relaxed whitespace-pre-wrap',
            isUser ? 'text-white' : 'text-gray-800 dark:text-gray-100'
          )}>
            {message.content}
          </p>
          <div className={cn(
            'flex items-center gap-1 mt-2 text-xs',
            isUser ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
          )}>
            <Clock className="w-3 h-3" />
            <span>
              {message.timestamp.toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </motion.div>

        {/* Rich Content with stagger animation */}
        {message.metadata && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-3 w-full"
          >
            {/* Service Cards */}
            {message.metadata.serviceCards?.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <ServiceCard service={service} />
              </motion.div>
            ))}

            {/* Air Quality Data */}
            {message.metadata.airQualityData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <AirQualityCard data={message.metadata.airQualityData} />
              </motion.div>
            )}

            {/* Routes */}
            {message.metadata.routes?.map((route, index) => (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <RouteCard route={route} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
