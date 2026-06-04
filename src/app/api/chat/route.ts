import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { HOPIUM_SYSTEM_PROMPT } from '@/lib/prompts';

export const runtime = 'edge';

const client = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY,
  baseURL: 'https://api.moonshot.cn/v1',
});

async function analyzeIntent(userInput: string) {
  const response = await client.chat.completions.create({
    model: 'moonshot-v1-8k',
    messages: [
      {
        role: 'system',
        content: `You are an intent analyzer for a stock sentiment bot. 
        Analyze the user input and return a JSON object with:
        - symbol: The stock ticker or name mentioned.
        - sentiment: 'bullish' if the user holds the stock (needs positive news), 'bearish' if they sold it (needs negative news).
        - reason: Brief explanation of the analysis.
        
        Return ONLY JSON.`,
      },
      { role: 'user', content: userInput },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

export async function POST(req: Request) {
  try {
    const { userInput, history } = await req.json();
    if (!userInput) return NextResponse.json({ error: 'No input' }, { status: 400 });

    // 1. Intent Analysis
    const intent = await analyzeIntent(userInput);
    const { symbol, sentiment, reason } = intent;

    // 2. Data Fetching with 8s Timeout Fallback
    let searchResults = '';
    if (symbol) {
      try {
        const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const searchRes = await fetch(`${baseUrl}/api/search?symbol=${encodeURIComponent(symbol)}&sentiment=${sentiment}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await searchRes.json();
        searchResults = JSON.stringify(data.news || []);
      } catch (e: any) {
        console.error('Search error or timeout:', e.name === 'AbortError' ? 'Timeout' : e);
        searchResults = '【搜索超时/无结果】';
      }
    }

    // 3. Final Response Generation
    const messages = [
      { role: 'system', content: HOPIUM_SYSTEM_PROMPT },
      ...history,
      { 
        role: 'user', 
        content: `<User_Input>${userInput}</User_Input>\n<News_Context>${searchResults || '无可用资讯'}</News_Context>` 
      },
    ];

    const stream = await client.chat.completions.create({
      model: 'moonshot-v1-8k',
      messages: messages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(encoder.encode(content));
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
