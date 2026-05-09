import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { messages, contextData } = body;
    
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response("Missing GOOGLE_GENERATIVE_AI_API_KEY in environment", { status: 500 });
    }

    // Ensure we have an array of messages
    if (!messages) messages = [];
    
    // If messages is empty, but there is a top-level message (some SDK versions)
    if (messages.length === 0 && body.message) {
      messages = [body.message];
    }

    const systemPrompt = `You are the Holy Moly Family AI Advisor. 
    Be concise. Currency is Ks.
    
    CONTEXT: ${JSON.stringify(contextData || {})}`;

    // Ensure each message has a role and content before conversion
    const validMessages = messages.filter((m: any) => m && (m.role || m.content || m.text));
    
    // Fallback: If no valid messages, but we have input, create a dummy user message
    if (validMessages.length === 0) {
      return new Response("Invalid request: No valid messages found.", { status: 400 });
    }

    const modelMessages = await convertToModelMessages(validMessages);
    
    const result = await streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    return new Response(error.message || "Internal Server Error", { status: 500 });
  }
}