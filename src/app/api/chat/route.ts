import { NextRequest, NextResponse } from 'next/server';
import { createClaudeClient, sendMessage } from '@/lib/claude/client';
import { buildSystemPrompt, buildMessagesForApi } from '@/lib/claude/prompts';
import { getConversation, getConcert, updateConversationMessages } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import type { Message, ScoreReference } from '@/types';

// Extract score references from text
function extractScoreReferences(text: string, pieceIds: string[]): ScoreReference[] {
  const references: ScoreReference[] = [];
  const defaultPieceId = pieceIds[0] || 'unknown';

  const patterns: { pattern: RegExp; type: ScoreReference['referenceType'] }[] = [
    { pattern: /\b(mm?\.\s*\d+(?:\s*[-–—]\s*\d+)?)/gi, type: 'measure' },
    { pattern: /\b(measures?\s*\d+(?:\s*[-–—to]+\s*\d+)?)/gi, type: 'measure' },
    { pattern: /\b(bars?\s*\d+(?:\s*[-–—to]+\s*\d+)?)/gi, type: 'measure' },
    { pattern: /\b(reh(?:earsal)?\.?\s*(?:letter|mark|no\.?)?\s*[A-Z])/gi, type: 'rehearsal_mark' },
    { pattern: /\b(movement\s*[IVX]+|\bmvt\.?\s*[IVX]+)/gi, type: 'movement' },
    { pattern: /\b(introduction|exposition|development|recapitulation|coda|bridge)\b/gi, type: 'section' },
  ];

  for (const { pattern, type } of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const start = Math.max(0, match.index - 50);
      const end = Math.min(text.length, match.index + match[0].length + 50);

      references.push({
        pieceId: defaultPieceId,
        referenceType: type,
        value: match[1],
        rawText: match[0],
        context: text.slice(start, end),
      });
    }
  }

  return references;
}

export async function POST(request: NextRequest) {
  try {
    const { conversationId, message } = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // Load conversation and concert data
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const concert = await getConcert(conversation.concertId);
    if (!concert) {
      return NextResponse.json(
        { error: 'Concert not found' },
        { status: 404 }
      );
    }

    const piecesToDiscuss = concert.program.filter(
      p => conversation.participant.piecesToDiscuss.includes(p.id)
    );

    // Build system prompt
    const systemPrompt = buildSystemPrompt(concert, conversation.participant, piecesToDiscuss);

    // Determine if this is initialization or a regular message
    const isInitialization = message === '[START_CONVERSATION]' || conversation.messages.length === 0;

    // Build messages for API
    let apiMessages;
    if (isInitialization) {
      // For initialization, just send a trigger to get the greeting
      apiMessages = [{ role: 'user' as const, content: 'Please begin the conversation with your greeting.' }];
    } else {
      apiMessages = buildMessagesForApi(systemPrompt, conversation.messages, message);
    }

    // Call Claude API
    const client = createClaudeClient();
    const assistantResponse = await sendMessage(client, systemPrompt, apiMessages);

    // Check if conversation is complete
    const isComplete = assistantResponse.includes('[CONVERSATION_COMPLETE]');
    const cleanedResponse = assistantResponse.replace('[CONVERSATION_COMPLETE]', '').trim();

    // Extract score references
    const pieceIds = piecesToDiscuss.map(p => p.id);
    const userRefs = message && message !== '[START_CONVERSATION]'
      ? extractScoreReferences(message, pieceIds)
      : [];
    const assistantRefs = extractScoreReferences(cleanedResponse, pieceIds);

    // Build new messages array
    const newMessages: Message[] = [...conversation.messages];

    // Add user message if not initialization
    if (!isInitialization && message) {
      newMessages.push({
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: Timestamp.now(),
        scoreReferences: userRefs,
      });
    }

    // Add assistant message
    newMessages.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: cleanedResponse,
      timestamp: Timestamp.now(),
      scoreReferences: assistantRefs,
    });

    // Update conversation in Firestore
    await updateConversationMessages(conversationId, newMessages);

    return NextResponse.json({
      message: cleanedResponse,
      scoreReferences: assistantRefs,
      isComplete,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
