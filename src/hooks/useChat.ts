'use client';

import { useState, useCallback } from 'react';
import type { Message, ChatResponse } from '@/types';

interface UseChatOptions {
  conversationId: string;
  initialMessages?: Message[];
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  isComplete: boolean;
  sendMessage: (content: string) => Promise<void>;
  initializeConversation: () => Promise<void>;
}

export function useChat({ conversationId, initialMessages = [] }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || isComplete) return;

    setIsLoading(true);
    setError(null);

    // Optimistically add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: content.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data: ChatResponse = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        scoreReferences: data.scoreReferences,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Check if conversation is complete
      if (data.isComplete) {
        setIsComplete(true);
        // Mark conversation as complete in database
        await fetch('/api/conversation', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            action: 'complete',
          }),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Remove optimistic user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, isLoading, isComplete]);

  const initializeConversation = useCallback(async () => {
    if (messages.length > 0) return; // Already initialized

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: '[START_CONVERSATION]',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start conversation');
      }

      const data: ChatResponse = await response.json();

      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        scoreReferences: data.scoreReferences,
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, messages.length]);

  return {
    messages,
    isLoading,
    error,
    isComplete,
    sendMessage,
    initializeConversation,
  };
}
