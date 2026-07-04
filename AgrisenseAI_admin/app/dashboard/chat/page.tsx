'use client';

import React from 'react';
import { ChatInterface } from '@/src/components/ChatInterface';

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-180px)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ChatInterface />
    </div>
  );
}
