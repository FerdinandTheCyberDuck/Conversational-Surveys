import { Timestamp } from 'firebase/firestore';

// Participant roles
export type ParticipantRole =
  | 'conductor'
  | 'soloist'
  | 'principal_player'
  | 'section_player'
  | 'artistic_planner'
  | 'composer'
  | 'other';

export const PARTICIPANT_ROLES: { value: ParticipantRole; label: string }[] = [
  { value: 'conductor', label: 'Conductor' },
  { value: 'soloist', label: 'Soloist' },
  { value: 'principal_player', label: 'Principal Player' },
  { value: 'section_player', label: 'Section Player' },
  { value: 'artistic_planner', label: 'Artistic Planner' },
  { value: 'composer', label: 'Composer' },
  { value: 'other', label: 'Other' },
];

// Score reference types
export type ScoreReferenceType = 'measure' | 'rehearsal_mark' | 'movement' | 'section' | 'other';

export interface ScoreReference {
  pieceId: string;
  referenceType: ScoreReferenceType;
  value: string;
  rawText: string;
  context: string;
}

// Program item (a piece in the concert)
export interface ProgramItem {
  id: string;
  composer: string;
  composerDates?: string;
  workTitle: string;
  movements?: string[];
  duration?: number;
  soloist?: string;
  notes?: string;
  order: number;
}

// Concert document
export interface Concert {
  id: string;
  title: string;
  date: Timestamp;
  venue: string;
  organization: string;
  program: ProgramItem[];
  createdAt: Timestamp;
  accessCode?: string;
  isActive: boolean;
}

// Participant info
export interface Participant {
  name: string;
  role: ParticipantRole;
  instrument?: string;
  piecesToDiscuss: string[];
}

// Message in conversation
export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date | Timestamp;
  scoreReferences?: ScoreReference[];
}

// Conversation status
export type ConversationStatus = 'in_progress' | 'completed' | 'abandoned';

// Conversation document
export interface Conversation {
  id: string;
  concertId: string;
  participant: Participant;
  messages: Message[];
  status: ConversationStatus;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  lastActivityAt: Timestamp;
}

// API request/response types
export interface ChatRequest {
  conversationId: string;
  message: string;
}

export interface ChatResponse {
  message: string;
  scoreReferences: ScoreReference[];
  isComplete?: boolean;
}

export interface CreateConversationRequest {
  concertId: string;
  participant: Participant;
}

// Form state for participant input
export interface ParticipantFormData {
  name: string;
  role: ParticipantRole;
  instrument: string;
  piecesToDiscuss: string[];
}
