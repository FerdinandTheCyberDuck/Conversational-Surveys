import Anthropic from '@anthropic-ai/sdk';

// Initialize client (will use ANTHROPIC_API_KEY env var)
export function createClaudeClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendMessage(
  client: Anthropic,
  systemPrompt: string,
  messages: ClaudeMessage[]
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    system: systemPrompt,
    messages: messages,
  });

  // Extract text from response
  const textContent = response.content.find(block => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in response');
  }

  return textContent.text;
}
