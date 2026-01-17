'use client';

import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  participantName?: string;
}

export default function MessageBubble({ message, participantName }: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant';

  // Highlight score references in text
  const highlightReferences = (text: string): React.ReactNode => {
    // Patterns for musical references
    const patterns = [
      /\b(mm?\.\s*\d+(?:\s*[-–—]\s*\d+)?)/gi,        // mm. 34-56, m. 34
      /\b(measures?\s*\d+(?:\s*[-–—to]+\s*\d+)?)/gi, // measure 34, measures 34-56
      /\b(bars?\s*\d+(?:\s*[-–—to]+\s*\d+)?)/gi,     // bar 34, bars 34-56
      /\b(reh(?:earsal)?\.?\s*(?:letter|mark|no\.?)?\s*[A-Z])/gi, // Rehearsal B, Reh. B
      /\b(movement\s*[IVX]+|\bmvt\.?\s*[IVX]+)/gi,   // Movement III, mvt. II
    ];

    let result = text;
    const highlights: { start: number; end: number; text: string }[] = [];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        // Avoid overlapping highlights
        const overlap = highlights.some(
          h => (match!.index >= h.start && match!.index < h.end) ||
               (match!.index + match![0].length > h.start && match!.index + match![0].length <= h.end)
        );
        if (!overlap) {
          highlights.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[0],
          });
        }
      }
    }

    if (highlights.length === 0) {
      return text;
    }

    // Sort by position
    highlights.sort((a, b) => a.start - b.start);

    // Build result with highlights
    const parts: React.ReactNode[] = [];
    let lastEnd = 0;

    highlights.forEach((h, i) => {
      if (h.start > lastEnd) {
        parts.push(text.slice(lastEnd, h.start));
      }
      parts.push(
        <span
          key={i}
          className="bg-amber-100 text-amber-800 px-1 rounded font-medium"
        >
          {h.text}
        </span>
      );
      lastEnd = h.end;
    });

    if (lastEnd < text.length) {
      parts.push(text.slice(lastEnd));
    }

    return parts;
  };

  return (
    <div
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} animate-fadeIn`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isAssistant
            ? 'bg-gray-100 text-gray-900 rounded-tl-sm'
            : 'bg-indigo-600 text-white rounded-tr-sm'
        }`}
      >
        {isAssistant && (
          <p className="text-xs font-medium text-indigo-600 mb-1">Interviewer</p>
        )}
        {!isAssistant && participantName && (
          <p className="text-xs font-medium text-indigo-200 mb-1">{participantName}</p>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {highlightReferences(message.content.replace('[CONVERSATION_COMPLETE]', '').trim())}
        </p>
      </div>
    </div>
  );
}
