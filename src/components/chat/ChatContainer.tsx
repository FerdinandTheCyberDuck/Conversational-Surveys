'use client';

import type { Message, Concert, Participant } from '@/types';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  concert: Concert;
  participant: Participant;
  isComplete?: boolean;
  onExport?: () => void;
}

export default function ChatContainer({
  messages,
  isLoading,
  onSendMessage,
  concert,
  participant,
  isComplete,
  onExport,
}: ChatContainerProps) {
  const piecesDiscussing = concert.program.filter(p =>
    participant.piecesToDiscuss.includes(p.id)
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">{concert.title}</h2>
            <p className="text-sm text-gray-600">
              Chatting with {participant.name} ({participant.role.replace(/_/g, ' ')})
            </p>
          </div>
          {isComplete && onExport && (
            <button
              onClick={onExport}
              className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
            >
              Download Transcript
            </button>
          )}
        </div>

        {/* Pieces being discussed */}
        <div className="flex flex-wrap gap-2 mt-3">
          {piecesDiscussing.map((piece) => (
            <span
              key={piece.id}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
            >
              {piece.composer.split(' ').pop()}: {piece.workTitle.split(',')[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        participantName={participant.name}
      />

      {/* Completion message */}
      {isComplete && (
        <div className="border-t border-gray-200 bg-green-50 px-4 py-3">
          <div className="flex items-center gap-2 text-green-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">
              Conversation complete! Thank you for sharing your insights.
            </p>
          </div>
        </div>
      )}

      {/* Input */}
      {!isComplete && (
        <ChatInput
          onSend={onSendMessage}
          disabled={isLoading}
        />
      )}
    </div>
  );
}
