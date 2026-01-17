import { NextRequest, NextResponse } from 'next/server';
import { getConversation, getConcert, formatConversationAsText } from '@/lib/firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
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

    const concert = await getConcert(conversation.concertId);
    if (!concert) {
      return NextResponse.json(
        { error: 'Concert not found' },
        { status: 404 }
      );
    }

    // Check format query param
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'text';

    if (format === 'json') {
      // Return raw JSON
      return NextResponse.json({
        conversation,
        concert: {
          id: concert.id,
          title: concert.title,
          organization: concert.organization,
          date: concert.date,
          venue: concert.venue,
          program: concert.program,
        },
      });
    }

    // Return plain text transcript
    const transcript = formatConversationAsText(conversation, concert);

    return new NextResponse(transcript, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="transcript-${conversationId}.txt"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export conversation' },
      { status: 500 }
    );
  }
}
