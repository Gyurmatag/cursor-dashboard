import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Force dynamic rendering to prevent response buffering/caching
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { env } = await getCloudflareContext();
    
    const apiKey = env.OPENAI_API_KEY as string;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const openai = createOpenAI({ apiKey });
    
    const { messages }: { messages: UIMessage[] } = await req.json();
    
    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const result = streamText({
      model: openai('gpt-5'),
      messages: await convertToModelMessages(messages),
      system: 'You are a helpful assistant for the Cursor AI Usage Dashboard. You help users understand their team\'s AI usage metrics and can answer questions about productivity, coding assistance, and AI-powered development workflows.',
      temperature: 0.7,
    });
    
    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ isAborted }) => {
        // Log completion for monitoring (optional)
        if (isAborted) {
          console.log('[Chat] Stream aborted by client');
        }
      },
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
