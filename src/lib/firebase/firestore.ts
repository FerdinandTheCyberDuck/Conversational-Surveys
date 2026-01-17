import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Concert, Conversation, Participant, Message } from '@/types';

// Collection references
const concertsCollection = collection(db, 'concerts');
const conversationsCollection = collection(db, 'conversations');

// Concert operations
export async function getConcert(concertId: string): Promise<Concert | null> {
  const docRef = doc(concertsCollection, concertId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as Concert;
}

export async function getActiveConcerts(): Promise<Concert[]> {
  const q = query(concertsCollection, where('isActive', '==', true));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Concert));
}

// Conversation operations
export async function createConversation(
  concertId: string,
  participant: Participant
): Promise<string> {
  const conversationData = {
    concertId,
    participant,
    messages: [],
    status: 'in_progress',
    startedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
  };

  const docRef = await addDoc(conversationsCollection, conversationData);
  return docRef.id;
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const docRef = doc(conversationsCollection, conversationId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as Conversation;
}

export async function addMessageToConversation(
  conversationId: string,
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<void> {
  const docRef = doc(conversationsCollection, conversationId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Conversation not found');
  }

  const conversation = docSnap.data() as Conversation;
  const newMessage: Message = {
    ...message,
    id: crypto.randomUUID(),
    timestamp: Timestamp.now(),
  };

  await updateDoc(docRef, {
    messages: [...conversation.messages, newMessage],
    lastActivityAt: serverTimestamp(),
  });
}

export async function updateConversationMessages(
  conversationId: string,
  messages: Message[]
): Promise<void> {
  const docRef = doc(conversationsCollection, conversationId);

  await updateDoc(docRef, {
    messages,
    lastActivityAt: serverTimestamp(),
  });
}

export async function completeConversation(conversationId: string): Promise<void> {
  const docRef = doc(conversationsCollection, conversationId);

  await updateDoc(docRef, {
    status: 'completed',
    completedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
  });
}

export async function getConversationsForConcert(concertId: string): Promise<Conversation[]> {
  const q = query(conversationsCollection, where('concertId', '==', concertId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Conversation));
}

// Helper to format conversation as plain text transcript
export function formatConversationAsText(
  conversation: Conversation,
  concert: Concert
): string {
  const participant = conversation.participant;
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════════',
    `CONCERT SURVEY TRANSCRIPT`,
    '═══════════════════════════════════════════════════════════════',
    '',
    `Concert: ${concert.title}`,
    `Organization: ${concert.organization}`,
    `Date: ${concert.date.toDate().toLocaleDateString()}`,
    `Venue: ${concert.venue}`,
    '',
    '───────────────────────────────────────────────────────────────',
    'PARTICIPANT',
    '───────────────────────────────────────────────────────────────',
    `Name: ${participant.name}`,
    `Role: ${participant.role.replace('_', ' ')}`,
    participant.instrument ? `Instrument: ${participant.instrument}` : '',
    '',
    'Pieces discussed:',
    ...concert.program
      .filter(p => participant.piecesToDiscuss.includes(p.id))
      .map(p => `  • ${p.composer}: ${p.workTitle}`),
    '',
    '───────────────────────────────────────────────────────────────',
    'CONVERSATION',
    '───────────────────────────────────────────────────────────────',
    '',
  ];

  for (const message of conversation.messages) {
    const speaker = message.role === 'assistant' ? 'INTERVIEWER' : participant.name.toUpperCase();
    lines.push(`[${speaker}]`);
    lines.push(message.content);
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push(`Generated: ${new Date().toISOString()}`);

  return lines.filter(line => line !== undefined).join('\n');
}
