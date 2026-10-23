import { NextRequest, NextResponse } from 'next/server';
import { routerAiClient, RouterChatMessage } from '@/src/server/ai/router-ai.client';
import { DEFAULT_AI_MODEL } from '@/src/core/constants/ai-models';
import { buildSystemPrompt } from '@/src/server/ai/system-prompt';
import { getServerSession } from '@/src/core/server/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    const body = await req.json();
    const defaultModel = routerAiClient.getDefaultModel();
    const {
      messages = [],
      model = defaultModel,
      temperature = 0.5,
      max_tokens = 4096,
      apiKey,
      projectId = routerAiClient.getProjectId(),
    } = body;

    const resolvedModel =
      model && model !== 'deepseek-ai/deepseek-v4.1-flash' ? model : defaultModel;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Build complete messages array with System Prompt at index 0
    const systemPrompt = buildSystemPrompt();
    const formattedMessages: RouterChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: unknown) => {
        const msg = m && typeof m === 'object' ? (m as Record<string, unknown>) : {};
        return {
          role: (msg.role === 'assistant' || msg.role === 'system' ? msg.role : 'user') as 'system' | 'user' | 'assistant',
          content: String(msg.content || ''),
        };
      }),
    ];

    // Capture diagnostic headers from router-ai before returning response
    let resolveHeaders: (headers: Record<string, string>) => void;
    const routerHeadersPromise = new Promise<Record<string, string>>((resolve) => {
      resolveHeaders = resolve;
    });

    const generator = routerAiClient.streamChat({
      model: resolvedModel,
      messages: formattedMessages,
      temperature,
      max_tokens,
      apiKey,
      projectId,
      userRole: session?.role || 'Administrator',
      userName: session?.username || 'mock-api-studio',
      signal: req.signal,
      onResponseHeaders: (rawHeaders) => {
        const forwarded: Record<string, string> = {};
        const relevantHeaders = [
          'x-9router-project',
          'x-9router-skill-status',
          'x-9router-knowledge-count',
          'x-9router-skills',
        ];

        for (const h of relevantHeaders) {
          const val = rawHeaders.get(h);
          if (val !== null && val !== undefined) {
            forwarded[h] = val;
          }
        }
        resolveHeaders(forwarded);
      },
    });

    // Advance generator by 1 chunk to immediately trigger fetch and onResponseHeaders
    const firstChunkPromise = generator.next();

    // Wait until router-ai headers arrive (up to 15 seconds for heavy RAG/embeddings)
    const timeoutPromise = new Promise<Record<string, string>>((resolve) =>
      setTimeout(() => resolve({}), 15000)
    );
    const forwardedHeaders = await Promise.race([routerHeadersPromise, timeoutPromise]);

    // Create ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        const handleChunk = (chunk: { type: string; text?: string }) => {
          if (chunk.type === 'reasoning') {
            sendEvent({ type: 'reasoning', text: chunk.text });
          } else if (chunk.type === 'content') {
            sendEvent({ type: 'content', text: chunk.text });
          } else if (chunk.type === 'error') {
            sendEvent({ type: 'error', text: chunk.text });
          } else if (chunk.type === 'done') {
            sendEvent({ type: 'done' });
          }
        };

        try {
          const firstChunk = await firstChunkPromise;
          if (!firstChunk.done && firstChunk.value) {
            handleChunk(firstChunk.value);
          }

          for await (const chunk of generator) {
            handleChunk(chunk);
          }
        } catch (err: unknown) {
          sendEvent({
            type: 'error',
            text: err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses streaming chat',
          });
        } finally {
          controller.close();
        }
      },
    });

    const responseHeaders: Record<string, string> = {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Expose-Headers':
        'X-9Router-Project, X-9Router-Skill-Status, X-9Router-Knowledge-Count, X-9Router-Skills',
    };

    if (forwardedHeaders['x-9router-project']) {
      responseHeaders['X-9Router-Project'] = forwardedHeaders['x-9router-project'];
    }
    if (forwardedHeaders['x-9router-skill-status']) {
      responseHeaders['X-9Router-Skill-Status'] = forwardedHeaders['x-9router-skill-status'];
    }
    if (forwardedHeaders['x-9router-knowledge-count'] !== undefined) {
      responseHeaders['X-9Router-Knowledge-Count'] = forwardedHeaders['x-9router-knowledge-count'];
    }
    if (forwardedHeaders['x-9router-skills']) {
      responseHeaders['X-9Router-Skills'] = forwardedHeaders['x-9router-skills'];
    }

    return new Response(stream, {
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
