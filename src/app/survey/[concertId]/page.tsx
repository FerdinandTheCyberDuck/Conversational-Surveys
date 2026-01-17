'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import ConcertInfo from '@/components/landing/ConcertInfo';
import ParticipantForm from '@/components/landing/ParticipantForm';
import ChatContainer from '@/components/chat/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { getConcert } from '@/lib/firebase/firestore';
import type { Concert, ParticipantFormData, Participant } from '@/types';

type PageState = 'loading' | 'form' | 'chat' | 'error';

export default function SurveyPage({ params }: { params: Promise<{ concertId: string }> }) {
  const { concertId } = use(params);
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [concert, setConcert] = useState<Concert | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  // Load concert data
  useEffect(() => {
    async function loadConcert() {
      try {
        const concertData = await getConcert(concertId);
        if (!concertData) {
          setErrorMessage('This survey link is not valid or has expired.');
          setPageState('error');
          return;
        }
        if (!concertData.isActive) {
          setErrorMessage('This survey is no longer accepting responses.');
          setPageState('error');
          return;
        }
        setConcert(concertData);
        setPageState('form');
      } catch (err) {
        console.error('Failed to load concert:', err);
        setErrorMessage('Failed to load survey. Please try again later.');
        setPageState('error');
      }
    }
    loadConcert();
  }, [concertId]);

  // Handle form submission
  const handleFormSubmit = async (formData: ParticipantFormData) => {
    console.log('handleFormSubmit called', formData);
    if (!concert) {
      console.log('No concert data');
      return;
    }

    setIsCreatingConversation(true);

    try {
      const participantData: Participant = {
        name: formData.name,
        role: formData.role,
        instrument: formData.instrument || undefined,
        piecesToDiscuss: formData.piecesToDiscuss,
      };

      console.log('Creating conversation...', { concertId, participant: participantData });

      // Create conversation in database
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concertId,
          participant: participantData,
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error('Failed to create conversation');
      }

      const { conversationId: newConversationId } = await response.json();
      console.log('Conversation created:', newConversationId);
      setConversationId(newConversationId);
      setParticipant(participantData);
      setPageState('chat');
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setErrorMessage('Failed to start the conversation. Please try again.');
      setPageState('error');
    } finally {
      setIsCreatingConversation(false);
    }
  };

  // Export conversation
  const handleExport = () => {
    if (conversationId) {
      window.open(`/api/export/${conversationId}`, '_blank');
    }
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Survey</h2>
          <p className="text-gray-600">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Form state
  if (pageState === 'form' && concert) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <ConcertInfo concert={concert} />
          <ParticipantForm
            concert={concert}
            onSubmit={handleFormSubmit}
            isLoading={isCreatingConversation}
          />
        </div>
      </div>
    );
  }

  // Chat state
  if (pageState === 'chat' && concert && conversationId && participant) {
    return (
      <div className="h-screen bg-gray-50 p-4">
        <div className="max-w-3xl mx-auto h-full">
          <ChatWrapper
            conversationId={conversationId}
            concert={concert}
            participant={participant}
            onExport={handleExport}
          />
        </div>
      </div>
    );
  }

  return null;
}

// Separate component to use the useChat hook
function ChatWrapper({
  conversationId,
  concert,
  participant,
  onExport,
}: {
  conversationId: string;
  concert: Concert;
  participant: Participant;
  onExport: () => void;
}) {
  const { messages, isLoading, error, isComplete, sendMessage, initializeConversation } = useChat({
    conversationId,
  });

  // Initialize conversation when component mounts
  useEffect(() => {
    initializeConversation();
  }, [initializeConversation]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChatContainer
      messages={messages}
      isLoading={isLoading}
      onSendMessage={sendMessage}
      concert={concert}
      participant={participant}
      isComplete={isComplete}
      onExport={onExport}
    />
  );
}
