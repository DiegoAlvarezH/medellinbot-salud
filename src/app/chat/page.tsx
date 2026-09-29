import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChatView } from '@/components/chat/ChatView';

export const metadata: Metadata = {
  title: 'Asistente',
  description: 'Pregunta por centros de salud, vacunación, calidad del aire y más en Medellín.',
};

export default function ChatPage() {
  return (
    <Suspense>
      <ChatView />
    </Suspense>
  );
}
