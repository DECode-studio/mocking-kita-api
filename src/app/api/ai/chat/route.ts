import { NextRequest, NextResponse } from 'next/server';
import { nimClient, NimChatMessage, DEFAULT_NIM_MODEL } from '@/src/server/ai/nvidia-nim.client';
import { buildSystemPrompt } from '@/src/server/ai/system-prompt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages = [],
      model = DEFAULT_NIM_MODEL,
      temperature = 0.5,
      max_tokens = 4096,
      apiKey,
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Build complete messages array with System Prompt at index 0
    const systemPrompt = buildSystemPrompt();
    const formattedMessages: NimChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: (m.role === 'assistant' || m.role === 'system' ? m.role : 'user') as 'system' | 'user' | 'assistant',
        content: String(m.content || ''),
      })),
    ];

    // Create ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (data: Record<string, any>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const generator = nimClient.streamChat({
            model,
            messages: formattedMessages,
            temperature,
            max_tokens,
            apiKey,
            signal: req.signal,
          });

          for await (const chunk of generator) {
            if (chunk.type === 'reasoning') {
              sendEvent({ type: 'reasoning', text: chunk.text });
            } else if (chunk.type === 'content') {
              sendEvent({ type: 'content', text: chunk.text });
            } else if (chunk.type === 'error') {
              sendEvent({ type: 'error', text: chunk.text });
            } else if (chunk.type === 'done') {
              sendEvent({ type: 'done' });
            }
          }
        } catch (err: any) {
          sendEvent({ type: 'error', text: err?.message || 'Terjadi kesalahan saat memproses streaming chat' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
