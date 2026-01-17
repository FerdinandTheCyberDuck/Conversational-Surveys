import { NextRequest, NextResponse } from 'next/server';
import { createConversation, getConversation, completeConversation } from '@/lib/firebase/firestore';
import type { CreateConversationRequest } from '@/types';

// POST - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const body: CreateConversationRequest = await request.json();

    if (!body.concertId || !body.participant) {
      return NextResponse.json(
        { error: 'concertId and participant are required' },
        { status: 400 }
      );
    }

    if (!body.participant.name || !body.participant.role || !body.participant.piecesToDiscuss?.length) {
      return NextResponse.json(
        { error: 'participant must have name, role, and piecesToDiscuss' },
        { status: 400 }
      );
    }

    const conversationId = await createConversation(body.concertId, body.participant);

    return NextResponse.json({ conversationId });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

// GET - Get a conversation by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'id parameter is required' },
        { status: 400 }
      );
    }

    const conversation = await getConversation(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to get conversation' },
      { status: 500 }
    );
  }
}

// PATCH - Update conversation status (e.g., mark as complete)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, action } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    if (action === 'complete') {
      await completeConversation(conversationId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}
