import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { chatTools } from '@/lib/chat-tools';

// Force dynamic rendering to prevent response buffering/caching
export const dynamic = 'force-dynamic';

// System prompt for Pulse
const SYSTEM_PROMPT = `You are Pulse, an intelligent AI assistant for the Cursor AI Usage Dashboard.

You have tools to fetch real-time data. Use them when users ask for specific information, but NOT for general conversation.

USE TOOLS when user asks for:
✅ Leaderboards/rankings: "top users", "who's leading", "show leaderboard"
✅ Specific user stats: "how is [name] doing?", "what are [name]'s stats?", "[name] stats today"
✅ Achievements: "what achievements", "show badges", "team achievements"
✅ Team metrics: "team stats", "total productivity", "team performance"

DO NOT use tools for:
❌ Greetings: "hello", "hi", "how are you"
❌ Thanks/acknowledgments: "thanks", "cool", "nice"
❌ General questions: "what can you do?", "help me"
❌ Commentary: "that's good", "interesting", "not bad"
❌ Text generation: "write a sentence", "tell me about", "explain"

DATE RANGES AVAILABLE:
All tools support these date ranges: 'today', 'yesterday', '7days', '14days', '30days', '60days', '90days', 'mtd', 'ytd', 'qtd', 'alltime'
- When users ask for "all time", "overall", "total", or "historical" data - USE 'alltime' dateRange
- Default to appropriate time ranges if not specified (7days for leaderboard, 30days for profiles)

IMPORTANT: If a user mentions a person's name with words like "stats", "performance", "metrics", "activity", "doing" - USE getUserProfile tool.

Examples:
- "What is John's stats?" → Use getUserProfile
- "How is Sarah doing today?" → Use getUserProfile with dateRange: 'today'
- "Show róka all time stats" → Use getUserProfile with dateRange: 'alltime'
- "Who are the top users overall?" → Use getLeaderboard with dateRange: 'alltime'
- "hello" → Respond conversationally (no tool)
- "that's great" → Respond conversationally (no tool)

Be helpful and conversational when not fetching data.`;

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
    
    const body = await req.json() as { messages: UIMessage[] };
    const messages = body.messages;
    
    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      console.error('[Pulse API] Invalid messages:', body);
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert UI messages to clean text-only format to avoid OpenAI API errors with tool results
    // This preserves conversation context while avoiding malformed tool call issues
    // Single-pass iteration for better performance (O(n) instead of O(2n))
    const cleanMessages: UIMessage[] = messages.reduce<UIMessage[]>((acc, msg) => {
      if (msg.role === 'user') {
        acc.push(msg); // Keep user messages as-is
      } else if (msg.role === 'assistant') {
        // Extract only text content from assistant messages, ignore tool results
        const textParts = msg.parts
          .filter(p => p.type === 'text')
          .map(p => p.type === 'text' ? p.text : '')
          .join('\n');
        
        // Only add assistant message if it has text content
        if (textParts.trim()) {
          acc.push({
            ...msg,
            parts: [{ type: 'text' as const, text: textParts }]
          });
        }
      } else {
        acc.push(msg);
      }
      return acc;
    }, []);
    
    const result = streamText({
      model: openai('gpt-4o'),
      messages: await convertToModelMessages(cleanMessages),
      system: SYSTEM_PROMPT,
      tools: chatTools,
      temperature: 0.7,
    });
    
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[Pulse API] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
