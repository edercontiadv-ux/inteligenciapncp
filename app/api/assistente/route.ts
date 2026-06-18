import { NextRequest } from 'next/server';
import { findAnswer, SYSTEM_DESCRIPTION } from '@/lib/assistente/knowledge-base';
import { ASSISTANT_SYSTEM_PROMPT } from '@/lib/assistente/prompts';

async function streamAnthropic(message: string, systemPrompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      stream: true,
    }),
  });

  if (!response.ok) return null;

  const reader = response.body?.getReader();
  if (!reader) return null;

  const decoder = new TextDecoder();
  let buffer = '';

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content_block_delta' && data.delta?.text) {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ token: data.delta.text })}\n\n`));
              }
            }
          }
        }
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ token: 'Desculpe, ocorreu um erro ao gerar a resposta.' })}\n\n`));
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
}

async function streamOpenAI(message: string, systemPrompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const baseURL = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    }),
  });

  if (!response.ok) return null;

  const reader = response.body?.getReader();
  if (!reader) return null;

  const decoder = new TextDecoder();
  let buffer = '';

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const data = JSON.parse(dataStr);
                const token = data.choices?.[0]?.delta?.content;
                if (token) {
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        }
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ token: 'Desculpe, ocorreu um erro ao gerar a resposta.' })}\n\n`));
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Mensagem é obrigatória' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (message.length > 1000) {
      return new Response(JSON.stringify({ error: 'Mensagem muito longa (máx. 1000 caracteres)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const contextualSystemPrompt = `${ASSISTANT_SYSTEM_PROMPT}

Contexto atual do usuário:
- Página: ${context?.currentPage || 'desconhecida'}
- Possui resultados de pesquisa: ${context?.hasResults ? 'sim' : 'não'}
- Termo de busca atual: ${context?.termoBusca || 'nenhum'}

Informações do sistema:
${SYSTEM_DESCRIPTION}`;

    const anthropicStream = await streamAnthropic(message, contextualSystemPrompt);
    if (anthropicStream) {
      return new Response(anthropicStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const openaiStream = await streamOpenAI(message, contextualSystemPrompt);
    if (openaiStream) {
      return new Response(openaiStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const fallbackAnswer = findAnswer(message);
    const resposta = fallbackAnswer || 'Desculpe, não tenho uma resposta para essa pergunta. Tente perguntar de outra forma ou pergunte sobre: pesquisa de preços, filtros, exportação PDF, tarefas processuais, cadastro de órgãos, login, ou base legal.';

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: resposta })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Erro no assistente:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
