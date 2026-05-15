import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  console.log("Chat API Request received");
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  console.log("API Key present:", !!apiKey);
  
  try {
    const body = await req.json();
    console.log("Request Body keys:", Object.keys(body));
    const { messages, data } = body;
    console.log("Received data context present:", !!data?.context);

    // Context received from the frontend app
    const financialContext = data?.context || "No financial context provided.";

    const systemPrompt = `You are the "Holy Moly Family Finance Manager", an expert, friendly, and strict financial advisor AI.
You MUST answer in Burmese language (မြန်မာဘာသာ) ONLY. Even if the user asks in English or another language, your response must be in Burmese.
Your purpose is to help the user and their family manage their personal and business finances based on the data provided.
You have access to the spending data of all family members. You can compare spending, identify who spent the most, and answer questions about specific members' habits if requested.
You can also analyze loans, debts, and borrowing patterns. Provide insights about loan health, interest calculations, and debt management strategies.

DO NOT answer questions unrelated to finance, budgeting, saving, loans, or the provided transaction data. If asked about outside topics (like coding, history, or general knowledge), politely refuse and redirect to their finances.

Here is the family's current financial context:
${financialContext}

Analyze the data across all members when answering. Be concise, practical, and encouraging. Address the user by their name if provided.`;

    const result = streamText({
      model: google('gemini-flash-lite-latest'),
      system: systemPrompt,
      messages,
    });

    const text = await result.text;
    return new Response(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error connecting to AI Provider' }), { status: 500 });
  }
}
